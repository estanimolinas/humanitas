-- Seed SOLO para desarrollo local: árbol de zonas de ejemplo.
-- Se aplica con `supabase db reset`. No se sube a producción: las zonas reales se cargan con los
-- barrios confirmados en la fase 0 del piloto.

with provincia as (
  insert into public.zonas (nombre, tipo) values ('Santa Fe', 'provincia')
  returning id
),
localidad as (
  insert into public.zonas (nombre, tipo, parent_id)
  select 'Santa Fe de la Vera Cruz', 'localidad', id from provincia
  returning id
)
insert into public.zonas (nombre, tipo, parent_id)
select b.nombre, 'barrio', localidad.id
from localidad,
  (values
    ('Guadalupe Oeste'),
    ('Los Hornos'),
    ('Coronel Dorrego'),
    ('Yapeyú'),
    ('Loyola Norte'),
    ('Scarafía')
  ) as b (nombre);
