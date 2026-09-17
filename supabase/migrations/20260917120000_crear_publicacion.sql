-- Publicar (7.3, R02) con los límites anti-abuso de 8.5 aplicados en la base:
--   * 3 publicaciones nuevas por persona por día,
--   * 20 activas en total.
-- Además fija vence_en según 8.6 (necesito 30 días, ofrezco 90) y valida que el rubro
-- corresponda al subtipo en los "ofrezco".

create function public.crear_publicacion(
  p_persona_id uuid,
  p_tipo text,
  p_subtipo text,
  p_rubro_id integer,
  p_rubro_otro_texto text,
  p_titulo text,
  p_descripcion text,
  p_precio_texto text,
  p_alias_pago text,
  p_foto_url text,
  p_zona_id integer,
  p_zona_otro_texto text
)
returns table (
  publicacion_id uuid,
  motivo_rechazo text
)
language plpgsql
set search_path = public
as $$
declare
  v_nuevas_hoy integer;
  v_activas integer;
  v_familia text;
  v_vence timestamptz;
  v_id uuid;
begin
  -- Un candado por persona: dos toques al mismo tiempo no pueden pasarse del límite.
  perform pg_advisory_xact_lock(hashtext(p_persona_id::text));

  select count(*) into v_nuevas_hoy
  from publicaciones pub
  where pub.persona_id = p_persona_id
    and pub.creada_en >= date_trunc('day', now());
  if v_nuevas_hoy >= 3 then
    return query select null::uuid, 'limite_diario'::text;
    return;
  end if;

  select count(*) into v_activas
  from publicaciones pub
  where pub.persona_id = p_persona_id
    and pub.estado = 'activa'
    and pub.archivado_en is null;
  if v_activas >= 20 then
    return query select null::uuid, 'limite_activas'::text;
    return;
  end if;

  -- El rubro tiene que ser de la familia del subtipo elegido (7.3).
  select rub.familia into v_familia from rubros rub
  where rub.id = p_rubro_id and rub.activo and rub.archivado_en is null;
  if v_familia is null then
    return query select null::uuid, 'rubro_invalido'::text;
    return;
  end if;
  if p_tipo = 'ofrezco' and v_familia <> p_subtipo then
    return query select null::uuid, 'rubro_no_corresponde'::text;
    return;
  end if;

  -- 8.6: vigencia
  v_vence := now() + case when p_tipo = 'necesito' then interval '30 days' else interval '90 days' end;

  insert into publicaciones (
    persona_id, tipo, subtipo, rubro_id, rubro_otro_texto, titulo, descripcion,
    precio_texto, alias_pago, foto_url, zona_id, zona_otro_texto, vence_en
  ) values (
    p_persona_id, p_tipo, p_subtipo, p_rubro_id, p_rubro_otro_texto, p_titulo, p_descripcion,
    p_precio_texto, p_alias_pago, p_foto_url, p_zona_id, p_zona_otro_texto, v_vence
  )
  returning publicaciones.id into v_id;

  return query select v_id, null::text;
end;
$$;

comment on function public.crear_publicacion is
  'Crea la publicación con los límites de 8.5 y la vigencia de 8.6. Queda activa (R02).';
