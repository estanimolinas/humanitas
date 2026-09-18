-- Seguridad (paso 11.5). Decisiones del usuario del 18/09/2026:
--   1. límites por conexión (IP cifrada) para crear cuentas y denunciar sin cuenta;
--   2. el token de sesión se renueva solo cada 30 días;
--   3. dar de baja borra el teléfono y el nombre (Ley 25.326, 10.6);
--   4. el listado rota cada publicación como máximo una vez por minuto (8.2, contra robots).

-- ── 1. Límites por conexión ──────────────────────────────────────────────────────────
-- La IP nunca se guarda en claro: la app guarda un SHA-256 de la IP con una sal secreta del
-- servidor (SAL_IP). Como eventos, crece y se poda con el script manual: es la otra tabla que
-- admite DELETE (sin triggers de borrado).
create table public.limites (
  id         bigint generated always as identity primary key,
  ip_hash    text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  accion     text not null check (accion in ('alta', 'denuncia_anonima')),
  creada_en  timestamptz not null default now()
);

create index limites_ip_accion_fecha on public.limites (ip_hash, accion, creada_en);

alter table public.limites enable row level security;
revoke all on table public.limites from anon, authenticated;

-- true: se permite y queda registrado. false: esa conexión ya llegó al máximo en 24 horas.
create function public.registrar_intento(p_ip_hash text, p_accion text, p_maximo integer)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_cantidad integer;
begin
  -- Dos pedidos simultáneos de la misma conexión no se saltean el máximo.
  perform pg_advisory_xact_lock(hashtext('limite:' || p_accion || ':' || p_ip_hash));

  select count(*) into v_cantidad
  from limites l
  where l.ip_hash = p_ip_hash
    and l.accion = p_accion
    and l.creada_en > now() - interval '24 hours';

  if v_cantidad >= p_maximo then
    return false;
  end if;

  insert into limites (ip_hash, accion) values (p_ip_hash, p_accion);
  return true;
end;
$$;

-- ── 2. Rotación del token ────────────────────────────────────────────────────────────
alter table public.personas
  add column token_emitido_en timestamptz not null default now();

-- Cambia el token si tiene más de p_dias. Devuelve si rotó y la fecha de emisión vigente
-- (null si el token no corresponde a ninguna cuenta activa).
create function public.rotar_token(p_hash_actual text, p_hash_nuevo text, p_dias integer)
returns table (rotado boolean, emitido_en timestamptz)
language plpgsql
set search_path = public
as $$
declare
  v_emitido timestamptz;
begin
  update personas per
  set token_hash = p_hash_nuevo, token_emitido_en = now()
  where per.token_hash = p_hash_actual
    and per.archivado_en is null
    and per.token_emitido_en < now() - make_interval(days => p_dias)
  returning per.token_emitido_en into v_emitido;

  if found then
    return query select true, v_emitido;
    return;
  end if;

  select per.token_emitido_en into v_emitido
  from personas per
  where per.token_hash = p_hash_actual and per.archivado_en is null;

  return query select false, v_emitido;
end;
$$;

-- ── 3. Baja con borrado de datos personales ──────────────────────────────────────────
-- El teléfono puede quedar vacío, pero solo en una cuenta dada de baja.
alter table public.personas alter column telefono drop not null;
alter table public.personas
  add constraint personas_telefono_si_activa check (telefono is not null or archivado_en is not null);

-- La hace el equipo con un script, a pedido de la persona (por el WhatsApp del equipo).
-- Borra teléfono y nombre, invalida la sesión y archiva sus publicaciones borrando lo que
-- pueda identificarla. Devuelve las fotos para que el script las borre del Storage.
-- Queda registrado en acciones_operador (P2).
create function public.dar_de_baja(p_persona_id uuid, p_operador_id uuid)
returns table (ok boolean, motivo_rechazo text, fotos text[])
language plpgsql
set search_path = public
as $$
declare
  v_es_operador boolean;
  v_fotos text[];
begin
  select per.es_operador into v_es_operador
  from personas per where per.id = p_operador_id and per.archivado_en is null;
  if v_es_operador is not true then
    return query select false, 'no_sos_operador'::text, null::text[];
    return;
  end if;

  update personas per
  set telefono = null,
      nombre = 'Cuenta dada de baja',
      zona_id = null,
      -- Ningún token puede dar este hash: SHA-256 en hex nunca empieza con "baja-".
      token_hash = 'baja-' || per.id::text,
      archivado_en = now()
  where per.id = p_persona_id and per.archivado_en is null;

  if not found then
    return query select false, 'no_existe'::text, null::text[];
    return;
  end if;

  select coalesce(array_agg(pub.foto_url), array[]::text[]) into v_fotos
  from publicaciones pub
  where pub.persona_id = p_persona_id and pub.foto_url is not null;

  update publicaciones pub
  set estado = 'archivada',
      archivado_en = coalesce(pub.archivado_en, now()),
      titulo = 'Publicación dada de baja',
      descripcion = null,
      precio_texto = null,
      alias_pago = null,
      foto_url = null,
      rubro_otro_texto = null,
      zona_otro_texto = null
  where pub.persona_id = p_persona_id;

  insert into acciones_operador (operador_id, accion, objetivo_tipo, objetivo_id)
  values (p_operador_id, 'dar_de_baja', 'persona', p_persona_id::text);

  return query select true, null::text, v_fotos;
end;
$$;

-- ── 4. Listado: rotación como máximo una vez por minuto ──────────────────────────────
-- Igual que antes (8.2), salvo que una publicación mostrada hace menos de un minuto no se
-- vuelve a escribir: un robot que recarga la página no genera escrituras sin fin.
create or replace function public.listar_publicaciones(
  p_tipo text,
  p_subtipo text default null,
  p_rubro_id integer default null,
  p_zona_id integer default null,           -- zona de quien mira: solo para ordenar
  p_limite integer default 10,
  p_excluir uuid[] default array[]::uuid[]  -- ya mostradas en esta pantalla ("Ver más")
)
returns table (
  id uuid,
  tipo text,
  subtipo text,
  titulo text,
  descripcion text,
  precio_texto text,
  foto_url text,
  creada_en timestamptz,
  rubro text,
  zona text,
  persona_nombre text,
  verificado_lugar text,
  concretados integer,
  contactos_mes integer
)
language plpgsql
set search_path = public
as $$
declare
  v_zona_madre integer;
begin
  select zonas.parent_id into v_zona_madre from zonas where zonas.id = p_zona_id;

  return query
  with elegidas as (
    select
      p.id,
      row_number() over (
        order by
          case
            when p_zona_id is not null and p.zona_id = p_zona_id then 0
            when v_zona_madre is not null and (
              p.zona_id = v_zona_madre
              or exists (select 1 from zonas z where z.id = p.zona_id and z.parent_id = v_zona_madre)
            ) then 1
            else 2
          end,
          p.ultima_exposicion,
          p.creada_en desc
      ) as orden
    from publicaciones p
    where p.estado = 'activa'
      and p.archivado_en is null
      and (p.vence_en is null or p.vence_en > now())   -- 8.6: lo vencido no se muestra
      and p.tipo = p_tipo
      and (p_subtipo is null or p.subtipo = p_subtipo)
      and (p_rubro_id is null or p.rubro_id = p_rubro_id)
      and not (p.id = any (p_excluir))
    order by orden
    limit greatest(p_limite, 0)
  ),
  -- 8.2: al servirse la página, lo mostrado pasa al final de la rotación, como máximo una vez
  -- por minuto por publicación.
  expuestas as (
    update publicaciones p
    set ultima_exposicion = now()
    where p.id in (select e.id from elegidas e)
      and p.ultima_exposicion < now() - interval '1 minute'
    returning p.id
  )
  select
    p.id,
    p.tipo,
    p.subtipo,
    p.titulo,
    p.descripcion,
    p.precio_texto,
    p.foto_url,
    p.creada_en,
    r.nombre as rubro,
    coalesce(z.nombre, p.zona_otro_texto) as zona,
    per.nombre as persona_nombre,
    per.verificado_lugar,
    (select count(*) from concretados c where c.persona_que_hizo_id = per.id)::integer as concretados,
    (select count(*) from contactos co
      where co.publicacion_id = p.id
        and co.archivado_en is null
        and co.creada_en >= date_trunc('month', now()))::integer as contactos_mes
  from elegidas e
  join publicaciones p on p.id = e.id
  join rubros r on r.id = p.rubro_id
  join personas per on per.id = p.persona_id
  left join zonas z on z.id = p.zona_id
  order by e.orden;
end;
$$;

revoke execute on function public.registrar_intento(text, text, integer) from anon, authenticated, public;
revoke execute on function public.rotar_token(text, text, integer) from anon, authenticated, public;
revoke execute on function public.dar_de_baja(uuid, uuid) from anon, authenticated, public;

comment on table public.limites is
  'Intentos por conexión (IP cifrada con sal) para altas y denuncias sin cuenta. Se poda con script.';
comment on function public.registrar_intento is
  'Registra un intento si la conexión no pasó el máximo de las últimas 24 horas (11.5).';
comment on function public.rotar_token is
  'Renueva el token de sesión si tiene más de p_dias (11.5).';
comment on function public.dar_de_baja is
  'Baja a pedido: borra teléfono y nombre, invalida la sesión y archiva sus publicaciones (Ley 25.326).';
comment on function public.listar_publicaciones is
  'Listado de la sección 7.1 con el orden de 8.2 (rotación como máximo 1 vez por minuto). La zona ordena, nunca filtra (8.1).';
