-- Listado con el orden de la sección 8.2, exactamente:
--   1. activas primero (solo activas entran en el listado),
--   2. rotación por ultima_exposicion ascendente, y al servirse la página se actualiza,
--   3. empate: más reciente primero.
-- La zona SOLO ordena (8.1): nunca aparece en el WHERE. Una publicación sin zona aparece siempre,
-- en el grupo "resto".
-- Filtrar por rubro, tipo y subtipo sí está permitido (7.1).

create function public.listar_publicaciones(
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
  -- Calificado con el nombre de la tabla: los nombres de las columnas que devuelve la función
  -- (id, tipo, …) son variables acá dentro y sin calificar serían ambiguos.
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
  -- 8.2: al servirse la página, lo mostrado pasa al final de la rotación.
  -- Postgres ejecuta siempre este UPDATE, aunque la consulta principal no lea su salida.
  expuestas as (
    update publicaciones p
    set ultima_exposicion = now()
    where p.id in (select e.id from elegidas e)
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
    -- 8.4: concretados confirmados por la contraparte
    (select count(*) from concretados c where c.persona_que_hizo_id = per.id)::integer as concretados,
    -- 8.4: en productos se muestra cuánta gente pidió contacto este mes
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

comment on function public.listar_publicaciones is
  'Listado de la sección 7.1 con el orden de 8.2. La zona ordena, nunca filtra (8.1).';
