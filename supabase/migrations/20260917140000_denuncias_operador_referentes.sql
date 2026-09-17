-- Denuncias (10.5, R09), cola del operador (R24 mínimo) y verificación presencial (R14, E2).
-- Toda intervención administrativa queda en acciones_operador (P2, E4).

-- ── Denunciar ────────────────────────────────────────────────────────────────────────
-- Dos denuncias de personas DISTINTAS ocultan la publicación (pasa a en_revision).
-- Una denuncia sin cuenta queda registrada para el operador, pero no oculta sola.
create function public.registrar_denuncia(
  p_publicacion_id uuid,
  p_persona_id uuid,
  p_motivo text,
  p_detalle text
)
returns table (ok boolean, motivo_rechazo text, quedo_oculta boolean)
language plpgsql
set search_path = public
as $$
declare
  v_estado text;
  v_distintas integer;
begin
  select pub.estado into v_estado
  from publicaciones pub
  where pub.id = p_publicacion_id and pub.archivado_en is null
  for update;

  if not found then
    return query select false, 'no_existe'::text, false;
    return;
  end if;
  if p_motivo not in ('estafa', 'contenido_inapropiado', 'posible_menor', 'otro') then
    return query select false, 'motivo_invalido'::text, false;
    return;
  end if;

  -- La misma persona no denuncia dos veces la misma publicación (índice único).
  insert into denuncias (publicacion_id, persona_id, motivo, detalle)
  values (p_publicacion_id, p_persona_id, p_motivo, p_detalle)
  on conflict (publicacion_id, persona_id) where persona_id is not null do nothing;

  select count(distinct d.persona_id) into v_distintas
  from denuncias d
  where d.publicacion_id = p_publicacion_id
    and d.persona_id is not null
    and d.archivado_en is null;

  if v_distintas >= 2 and v_estado = 'activa' then
    update publicaciones pub set estado = 'en_revision' where pub.id = p_publicacion_id;
    return query select true, null::text, true;
    return;
  end if;

  return query select true, null::text, false;
end;
$$;

-- ── Operador ─────────────────────────────────────────────────────────────────────────
-- Resuelve una publicación en revisión: la archiva o la devuelve al listado. Siempre queda
-- registrado quién lo hizo (P2).
create function public.resolver_revision(
  p_publicacion_id uuid,
  p_operador_id uuid,
  p_accion text,          -- 'archivar' | 'reactivar'
  p_resolucion text
)
returns table (ok boolean, motivo_rechazo text)
language plpgsql
set search_path = public
as $$
declare
  v_es_operador boolean;
begin
  select per.es_operador into v_es_operador
  from personas per where per.id = p_operador_id and per.archivado_en is null;
  if v_es_operador is not true then
    return query select false, 'no_sos_operador'::text;
    return;
  end if;
  if p_accion not in ('archivar', 'reactivar') then
    return query select false, 'accion_invalida'::text;
    return;
  end if;

  if p_accion = 'archivar' then
    update publicaciones pub
    set estado = 'archivada', archivado_en = now()
    where pub.id = p_publicacion_id;
  else
    update publicaciones pub
    set estado = 'activa'
    where pub.id = p_publicacion_id and pub.archivado_en is null;
  end if;

  if not found then
    return query select false, 'no_existe'::text;
    return;
  end if;

  update denuncias d
  set resuelta_en = now(), resolucion = p_resolucion
  where d.publicacion_id = p_publicacion_id and d.resuelta_en is null;

  insert into acciones_operador (operador_id, accion, objetivo_tipo, objetivo_id)
  values (p_operador_id, p_accion, 'publicacion', p_publicacion_id::text);

  return query select true, null::text;
end;
$$;

-- ── Referentes ───────────────────────────────────────────────────────────────────────
-- Un referente activo marca a una persona como verificada en persona (R14). Queda quién,
-- cuándo y dónde.
create function public.verificar_persona(
  p_persona_id uuid,
  p_referente_persona_id uuid
)
returns table (ok boolean, motivo_rechazo text, lugar text)
language plpgsql
set search_path = public
as $$
declare
  v_ref record;
begin
  select ref.id, ref.lugar into v_ref
  from referentes ref
  where ref.persona_id = p_referente_persona_id
    and ref.activo
    and ref.archivado_en is null
  limit 1;

  if not found then
    return query select false, 'no_sos_referente'::text, null::text;
    return;
  end if;
  if p_persona_id = p_referente_persona_id then
    return query select false, 'no_te_verificas_sola'::text, null::text;
    return;
  end if;

  update personas per
  set verificado_por_referente_id = v_ref.id,
      verificado_en = now(),
      verificado_lugar = v_ref.lugar
  where per.id = p_persona_id and per.archivado_en is null;

  if not found then
    return query select false, 'no_existe'::text, null::text;
    return;
  end if;

  insert into acciones_operador (operador_id, accion, objetivo_tipo, objetivo_id)
  values (p_referente_persona_id, 'verificar_persona', 'persona', p_persona_id::text);

  return query select true, null::text, v_ref.lugar;
end;
$$;

comment on function public.registrar_denuncia is
  'Registra la denuncia (10.5). Con 2 denuncias de personas distintas la publicación pasa a en_revision (R09).';
comment on function public.resolver_revision is
  'El operador archiva o devuelve al listado una publicación en revisión. Queda en acciones_operador (P2).';
comment on function public.verificar_persona is
  'Un referente activo marca a una persona como verificada en persona (R14).';
