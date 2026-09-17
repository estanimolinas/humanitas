-- Contactar (7.2, R04): registra la revelación del teléfono en `contactos` (8.3) y aplica el
-- límite de 8.5 (15 solicitudes por persona por día) en la base, de forma atómica.
-- El teléfono sale SOLO por acá, y solo para armar el link wa.me en el servidor (R05).

create function public.registrar_contacto(
  p_publicacion_id uuid,
  p_persona_id uuid
)
returns table (
  limite_alcanzado boolean,
  telefono text,
  titulo text,
  nombre text
)
language plpgsql
set search_path = public
as $$
declare
  v_hoy integer;
  v_pub record;
begin
  -- Un candado por persona: dos toques al mismo tiempo no pueden pasarse del límite.
  perform pg_advisory_xact_lock(hashtext(p_persona_id::text));

  select count(*) into v_hoy
  from contactos c
  where c.persona_solicitante_id = p_persona_id
    and c.creada_en >= date_trunc('day', now());

  if v_hoy >= 15 then
    return query select true, null::text, null::text, null::text;
    return;
  end if;

  select p.titulo as titulo, per.telefono as telefono, per.nombre as nombre
  into v_pub
  from publicaciones p
  join personas per on per.id = p.persona_id
  where p.id = p_publicacion_id
    and p.estado = 'activa'
    and p.archivado_en is null
    and per.archivado_en is null;

  if not found then
    raise exception 'Humanitas: la publicación no está disponible' using errcode = 'no_data_found';
  end if;

  insert into contactos (publicacion_id, persona_solicitante_id)
  values (p_publicacion_id, p_persona_id);

  return query select false, v_pub.telefono, v_pub.titulo, v_pub.nombre;
end;
$$;

comment on function public.registrar_contacto is
  'Registra el contacto (8.3), aplica el límite diario de 8.5 y devuelve el teléfono solo para armar el link wa.me en el servidor.';
