-- Mis publicaciones (7.4): cerrar y reactivar.
-- 8.4: el contador de concretados SOLO sube desde el cierre confirmado por la contraparte, y la
-- persona elegida tiene que ser alguien que pidió contacto por esa publicación. Nunca se autoasigna
-- (lo impide además el CHECK de la tabla concretados).

create function public.cerrar_publicacion(
  p_publicacion_id uuid,
  p_persona_id uuid,
  p_motivo text,
  p_persona_que_hizo_id uuid default null
)
returns table (ok boolean, motivo_rechazo text)
language plpgsql
set search_path = public
as $$
declare
  v_pub record;
begin
  select pub.id, pub.tipo, pub.estado, pub.persona_id
  into v_pub
  from publicaciones pub
  where pub.id = p_publicacion_id and pub.archivado_en is null
  for update;

  if not found or v_pub.persona_id <> p_persona_id then
    return query select false, 'no_es_tuya'::text;
    return;
  end if;
  if v_pub.estado <> 'activa' then
    return query select false, 'no_esta_activa'::text;
    return;
  end if;

  if v_pub.tipo = 'necesito' then
    if p_motivo not in ('resuelta_con_alguien_de_aca', 'resuelta_por_otro_lado', 'ya_no_la_necesita') then
      return query select false, 'motivo_invalido'::text;
      return;
    end if;
  else
    if p_motivo <> 'cerrada_por_duenio' then
      return query select false, 'motivo_invalido'::text;
      return;
    end if;
  end if;

  if p_motivo = 'resuelta_con_alguien_de_aca' then
    -- Solo se puede elegir a alguien que pidió contacto por esta publicación (8.4).
    if p_persona_que_hizo_id is null
      or not exists (
        select 1 from contactos c
        where c.publicacion_id = p_publicacion_id
          and c.persona_solicitante_id = p_persona_que_hizo_id
      )
    then
      return query select false, 'no_te_contacto'::text;
      return;
    end if;

    insert into concretados (publicacion_necesito_id, persona_que_hizo_id, confirmado_por_persona_id)
    values (p_publicacion_id, p_persona_que_hizo_id, p_persona_id)
    on conflict (publicacion_necesito_id) do nothing;
  end if;

  update publicaciones pub
  set estado = 'cerrada', cierre_motivo = p_motivo, cerrada_en = now()
  where pub.id = p_publicacion_id;

  return query select true, null::text;
end;
$$;

-- Reactivar (5.2): vuelve a activa con vigencia nueva (8.6). No toca ultima_exposicion, así no
-- se puede usar para saltar la rotación (8.2).
create function public.reactivar_publicacion(
  p_publicacion_id uuid,
  p_persona_id uuid
)
returns table (ok boolean, motivo_rechazo text)
language plpgsql
set search_path = public
as $$
declare
  v_pub record;
  v_activas integer;
begin
  select pub.id, pub.tipo, pub.estado, pub.persona_id
  into v_pub
  from publicaciones pub
  where pub.id = p_publicacion_id and pub.archivado_en is null
  for update;

  if not found or v_pub.persona_id <> p_persona_id then
    return query select false, 'no_es_tuya'::text;
    return;
  end if;
  if v_pub.estado not in ('cerrada', 'archivada') then
    return query select false, 'no_esta_cerrada'::text;
    return;
  end if;

  select count(*) into v_activas
  from publicaciones pub
  where pub.persona_id = p_persona_id and pub.estado = 'activa' and pub.archivado_en is null;
  if v_activas >= 20 then
    return query select false, 'limite_activas'::text;
    return;
  end if;

  update publicaciones pub
  set estado = 'activa',
      cierre_motivo = null,
      cerrada_en = null,
      vence_en = now() + case when v_pub.tipo = 'necesito' then interval '30 days' else interval '90 days' end
  where pub.id = p_publicacion_id;

  return query select true, null::text;
end;
$$;

comment on function public.cerrar_publicacion is
  'Cierra una publicación propia. Con "resuelta con alguien de acá" inserta el concretado confirmado (8.4).';
comment on function public.reactivar_publicacion is
  'Reactiva una publicación propia con vigencia nueva, sin alterar la rotación.';
