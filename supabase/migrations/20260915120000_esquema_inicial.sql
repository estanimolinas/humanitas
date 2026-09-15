-- Humanitas — esquema inicial (requerimiento 12.3 + decisiones del 14/09/2026, ver CLAUDE.md)
--
-- Reglas que este archivo hace cumplir en la base, no solo en el código:
--   * Ningún DELETE ni TRUNCATE (R12). Única excepción: `eventos`, que se poda después de agregarse
--     en `eventos_mensuales`.
--   * Las roles públicas de Supabase (anon, authenticated) no tienen acceso a nada. Todo acceso es
--     desde el servidor con la service role.

-- ---------------------------------------------------------------------------------------------
-- Funciones de soporte
-- ---------------------------------------------------------------------------------------------

create function public.impedir_borrado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Humanitas: no se borran filas de "%". Toda baja es archivado_en (R12).', tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

create function public.tocar_actualizada_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizada_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- zonas: árbol provincia → localidad → barrio, cargado por datos (8.1)
-- ---------------------------------------------------------------------------------------------

create table public.zonas (
  id           integer generated always as identity primary key,
  nombre       text not null check (char_length(trim(nombre)) between 1 and 80),
  tipo         text not null check (tipo in ('provincia', 'localidad', 'barrio')),
  parent_id    integer references public.zonas (id),
  lat          numeric(9, 6),
  lng          numeric(9, 6),
  archivado_en timestamptz,
  unique nulls not distinct (parent_id, nombre)
);

create index zonas_parent_id_idx on public.zonas (parent_id);

-- ---------------------------------------------------------------------------------------------
-- rubros (sección 6): editables desde datos, nunca desde el código
-- ---------------------------------------------------------------------------------------------

create table public.rubros (
  id           integer generated always as identity primary key,
  nombre       text not null check (char_length(trim(nombre)) between 1 and 80),
  familia      text not null check (familia in ('servicio', 'producto')),
  orden        smallint not null,
  activo       boolean not null default true,
  archivado_en timestamptz,
  unique (familia, nombre)
);

-- ---------------------------------------------------------------------------------------------
-- personas: un solo tipo de usuario (4.1). El operador es una persona con es_operador.
-- ---------------------------------------------------------------------------------------------

create table public.personas (
  id                          uuid primary key default gen_random_uuid(),
  nombre                      text not null check (char_length(trim(nombre)) between 1 and 80),
  -- Normalizado para wa.me: 549 + código de área + número, sin 0 ni 15 (10 dígitos después de 549).
  telefono                    text not null unique check (telefono ~ '^549[0-9]{10}$'),
  zona_id                     integer references public.zonas (id),
  verificado_por_referente_id uuid, -- FK agregada después de crear referentes
  verificado_en               timestamptz,
  verificado_lugar            text,
  -- Token de sesión: en la base SOLO el hash; en claro solo en la cookie httpOnly.
  token_hash                  text not null unique,
  terminos_aceptados_en       timestamptz not null,
  mayoria_edad_declarada      boolean not null check (mayoria_edad_declarada), -- R16
  es_operador                 boolean not null default false,
  creada_en                   timestamptz not null default now(),
  archivado_en                timestamptz,
  -- La verificación (R14) se registra completa o no se registra: quién, cuándo y dónde.
  check (
    (verificado_por_referente_id is null and verificado_en is null and verificado_lugar is null)
    or (verificado_por_referente_id is not null and verificado_en is not null and verificado_lugar is not null)
  )
);

create index personas_zona_id_idx on public.personas (zona_id);

-- ---------------------------------------------------------------------------------------------
-- referentes (4.3, R14)
-- ---------------------------------------------------------------------------------------------

create table public.referentes (
  id           uuid primary key default gen_random_uuid(),
  persona_id   uuid not null references public.personas (id),
  lugar        text not null check (char_length(trim(lugar)) between 1 and 120),
  activo       boolean not null default true,
  alta_en      timestamptz not null default now(),
  archivado_en timestamptz
);

create index referentes_persona_id_idx on public.referentes (persona_id);

alter table public.personas
  add constraint personas_verificado_por_referente_id_fkey
  foreign key (verificado_por_referente_id) references public.referentes (id);

-- ---------------------------------------------------------------------------------------------
-- publicaciones (5.1, 5.2, 7.3)
-- ---------------------------------------------------------------------------------------------

create table public.publicaciones (
  id                uuid primary key default gen_random_uuid(),
  persona_id        uuid not null references public.personas (id),
  tipo              text not null check (tipo in ('ofrezco', 'necesito')),
  subtipo           text check (subtipo in ('servicio', 'producto')),
  rubro_id          integer not null references public.rubros (id),
  rubro_otro_texto  text check (char_length(rubro_otro_texto) <= 80),
  titulo            text not null check (char_length(trim(titulo)) between 1 and 60),
  descripcion       text check (char_length(descripcion) <= 500),
  precio_texto      text check (char_length(precio_texto) <= 80),
  alias_pago        text check (char_length(alias_pago) <= 80),
  foto_url          text,
  zona_id           integer references public.zonas (id),
  zona_otro_texto   text check (char_length(zona_otro_texto) <= 80),
  estado            text not null default 'activa'
                    check (estado in ('activa', 'cerrada', 'en_revision', 'archivada')),
  cierre_motivo     text check (cierre_motivo in (
                      'resuelta_con_alguien_de_aca', -- necesito: "Sí, con alguien de acá" (8.4)
                      'resuelta_por_otro_lado',      -- necesito: "Sí, por otro lado"
                      'ya_no_la_necesita',           -- necesito: "No, ya no lo necesito"
                      'cerrada_por_duenio',          -- ofrezco: "simplemente pasa a cerrado"
                      'vencida'                      -- 8.6, la marca el script manual de vencimientos
                    )),
  cerrada_en        timestamptz,
  -- 8.2: nunca expuesta = la exposición más antigua posible, así quien recién entra aparece primero.
  ultima_exposicion timestamptz not null default '-infinity',
  vence_en          timestamptz,
  creada_en         timestamptz not null default now(),
  actualizada_en    timestamptz not null default now(),
  archivado_en      timestamptz,
  -- Ofrezco lleva subtipo; necesito no (5.1).
  check (
    (tipo = 'ofrezco' and subtipo is not null)
    or (tipo = 'necesito' and subtipo is null)
  ),
  -- "Mi zona no está" guarda el texto en lugar de una zona del árbol (7.3, B5).
  check (zona_id is null or zona_otro_texto is null)
);

-- Listado (8.2): filtros por solapa/rubro y orden por rotación.
create index publicaciones_listado_idx
  on public.publicaciones (tipo, subtipo, rubro_id, ultima_exposicion, creada_en desc)
  where estado = 'activa';
-- Mis publicaciones y límites anti-abuso (8.5: 3 nuevas por día, 20 activas).
create index publicaciones_persona_idx on public.publicaciones (persona_id, creada_en);

create trigger publicaciones_actualizada_en
  before update on public.publicaciones
  for each row execute function public.tocar_actualizada_en();

-- ---------------------------------------------------------------------------------------------
-- contactos: cada revelación de teléfono (5.3, 8.3)
-- ---------------------------------------------------------------------------------------------

create table public.contactos (
  id                     uuid primary key default gen_random_uuid(),
  publicacion_id         uuid not null references public.publicaciones (id),
  persona_solicitante_id uuid not null references public.personas (id),
  creada_en              timestamptz not null default now(),
  archivado_en           timestamptz
);

create index contactos_publicacion_idx on public.contactos (publicacion_id);
-- Límite 8.5: 15 solicitudes por persona por día.
create index contactos_solicitante_idx on public.contactos (persona_solicitante_id, creada_en);

-- ---------------------------------------------------------------------------------------------
-- concretados: solo desde el cierre confirmado por la contraparte (8.4)
-- ---------------------------------------------------------------------------------------------

create table public.concretados (
  id                        uuid primary key default gen_random_uuid(),
  publicacion_necesito_id   uuid not null unique references public.publicaciones (id),
  persona_que_hizo_id       uuid not null references public.personas (id),
  confirmado_por_persona_id uuid not null references public.personas (id),
  creada_en                 timestamptz not null default now(),
  -- Nunca se autoasigna.
  check (persona_que_hizo_id <> confirmado_por_persona_id)
);

create index concretados_persona_que_hizo_idx on public.concretados (persona_que_hizo_id);

-- ---------------------------------------------------------------------------------------------
-- denuncias (10.5, R09, R16)
-- ---------------------------------------------------------------------------------------------

create table public.denuncias (
  id             uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id),
  persona_id     uuid references public.personas (id),
  motivo         text not null check (motivo in ('estafa', 'contenido_inapropiado', 'posible_menor', 'otro')),
  detalle        text check (char_length(detalle) <= 500),
  creada_en      timestamptz not null default now(),
  resuelta_en    timestamptz,
  resolucion     text check (char_length(resolucion) <= 500),
  archivado_en   timestamptz
);

create index denuncias_publicacion_idx on public.denuncias (publicacion_id);
-- R09: cuentan personas distintas; la misma persona no denuncia dos veces la misma publicación.
create unique index denuncias_una_por_persona_idx
  on public.denuncias (publicacion_id, persona_id)
  where persona_id is not null;

-- ---------------------------------------------------------------------------------------------
-- eventos (R15): sin persona. Lo único que crece; se agrega y se poda con script manual.
-- ---------------------------------------------------------------------------------------------

create table public.eventos (
  id             bigint generated always as identity primary key,
  tipo           text not null check (tipo in ('vista', 'contacto', 'busqueda_sin_resultado', 'cierre')),
  publicacion_id uuid references public.publicaciones (id),
  rubro_id       integer references public.rubros (id),
  zona_id        integer references public.zonas (id),
  creada_en      timestamptz not null default now()
);

create index eventos_creada_en_idx on public.eventos (creada_en);

-- ---------------------------------------------------------------------------------------------
-- eventos_mensuales: agregado de eventos que llena el script de poda (decisión 14/09/2026)
-- ---------------------------------------------------------------------------------------------

create table public.eventos_mensuales (
  mes      date not null check (mes = date_trunc('month', mes)::date),
  tipo     text not null check (tipo in ('vista', 'contacto', 'busqueda_sin_resultado', 'cierre')),
  rubro_id integer references public.rubros (id),
  zona_id  integer references public.zonas (id),
  cantidad integer not null check (cantidad >= 0),
  unique nulls not distinct (mes, tipo, rubro_id, zona_id)
);

-- ---------------------------------------------------------------------------------------------
-- acciones_operador: registro público de toda intervención administrativa (P2, E4)
-- ---------------------------------------------------------------------------------------------

create table public.acciones_operador (
  id            uuid primary key default gen_random_uuid(),
  operador_id   uuid not null references public.personas (id),
  accion        text not null check (char_length(trim(accion)) between 1 and 80),
  objetivo_tipo text not null check (char_length(trim(objetivo_tipo)) between 1 and 80),
  objetivo_id   text not null,
  creada_en     timestamptz not null default now()
);

create index acciones_operador_creada_en_idx on public.acciones_operador (creada_en);

-- ---------------------------------------------------------------------------------------------
-- Ningún DELETE ni TRUNCATE (R12). `eventos` es la única excepción (poda manual).
-- ---------------------------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'zonas', 'rubros', 'personas', 'referentes', 'publicaciones', 'contactos',
    'concretados', 'denuncias', 'eventos_mensuales', 'acciones_operador'
  ]
  loop
    execute format(
      'create trigger %I before delete on public.%I for each row execute function public.impedir_borrado()',
      t || '_sin_delete', t
    );
    execute format(
      'create trigger %I before truncate on public.%I for each statement execute function public.impedir_borrado()',
      t || '_sin_truncate', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Acceso: el cliente nunca habla con Supabase. RLS activo sin políticas y sin permisos para
-- anon/authenticated, así una key pública filtrada no lee ni escribe nada.
-- La service role (solo servidor) ignora RLS.
-- ---------------------------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'zonas', 'rubros', 'personas', 'referentes', 'publicaciones', 'contactos',
    'concretados', 'denuncias', 'eventos', 'eventos_mensuales', 'acciones_operador'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end;
$$;

revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated, public;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
