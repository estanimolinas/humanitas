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

-- ── Personas y publicaciones de ejemplo (SOLO desarrollo local) ──────────────────────
-- Sirven para ver el listado con datos. En producción no se cargan.
do $$
declare
  v_ruben uuid; v_lucia uuid; v_nelida uuid; v_miguel uuid;
  v_ref_hornos uuid; v_ref_guadalupe uuid;
  v_hornos integer; v_guadalupe integer; v_yapeyu integer; v_dorrego integer;
begin
  select id into v_hornos from zonas where nombre = 'Los Hornos' and tipo = 'barrio';
  select id into v_guadalupe from zonas where nombre = 'Guadalupe Oeste' and tipo = 'barrio';
  select id into v_yapeyu from zonas where nombre = 'Yapeyú' and tipo = 'barrio';
  select id into v_dorrego from zonas where nombre = 'Coronel Dorrego' and tipo = 'barrio';

  insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada, zona_id)
  values
    ('Rubén',  '5493425550001', 'seed-ruben',  now(), true, v_hornos),
    ('Lucía',  '5493425550002', 'seed-lucia',  now(), true, v_yapeyu),
    ('Nélida', '5493425550003', 'seed-nelida', now(), true, v_guadalupe),
    ('Miguel', '5493425550004', 'seed-miguel', now(), true, null);

  select id into v_ruben  from personas where telefono = '5493425550001';
  select id into v_lucia  from personas where telefono = '5493425550002';
  select id into v_nelida from personas where telefono = '5493425550003';
  select id into v_miguel from personas where telefono = '5493425550004';

  -- Referentes de ejemplo y verificación presencial (R14)
  insert into referentes (persona_id, lugar) values (v_ruben, 'Vecinal Los Hornos') returning id into v_ref_hornos;
  insert into referentes (persona_id, lugar) values (v_nelida, 'Parroquia de Guadalupe') returning id into v_ref_guadalupe;
  update personas set verificado_por_referente_id = v_ref_hornos, verificado_en = now(),
    verificado_lugar = 'Vecinal Los Hornos' where id = v_ruben;
  update personas set verificado_por_referente_id = v_ref_guadalupe, verificado_en = now(),
    verificado_lugar = 'Parroquia de Guadalupe' where id = v_nelida;

  insert into publicaciones
    (persona_id, tipo, subtipo, rubro_id, titulo, descripcion, precio_texto, zona_id, creada_en, vence_en)
  values
    (v_ruben, 'ofrezco', 'servicio',
      (select id from rubros where nombre = 'Albañilería y construcción'),
      'Revoque, contrapiso y arreglos de humedad',
      'Trabajo por día o por metro. Llevo mis herramientas. Presupuesto sin cargo en el barrio.',
      'Por día o por metro', v_hornos, now() - interval '2 days', now() + interval '88 days'),
    (v_nelida, 'ofrezco', 'producto',
      (select id from rubros where nombre = 'Panadería y pastelería'),
      'Pan casero y facturas por encargo',
      'Se encarga el día anterior y se retira desde las 7 de la mañana.',
      '$1500 la docena', v_guadalupe, now() - interval '1 day', now() + interval '89 days'),
    (v_miguel, 'ofrezco', 'servicio',
      (select id from rubros where nombre = 'Mudanzas y fletes'),
      'Flete chico con ayudante',
      'Mudanzas chicas, escombro y materiales. Cobro por viaje según distancia.',
      'Por viaje', null, now() - interval '12 hours', now() + interval '89 days'),
    (v_lucia, 'ofrezco', 'servicio',
      (select id from rubros where nombre = 'Costura y arreglos de ropa'),
      'Arreglos de ropa y dobladillos', null, 'A convenir', v_yapeyu,
      now() - interval '5 days', now() + interval '85 days'),
    (v_lucia, 'necesito', null,
      (select id from rubros where nombre = 'Pintura'),
      'Pintor para dos ambientes y el frente',
      'La pintura la compro yo. Necesito presupuesto de mano de obra y una fecha.',
      'Mano de obra', v_yapeyu, now() - interval '6 days', now() + interval '24 days'),
    (v_ruben, 'necesito', null,
      (select id from rubros where nombre = 'Electricidad y plomería'),
      'Alguien que arregle una pérdida de agua',
      'Pierde el tanque. Puede ser esta semana a la tarde.', null, v_hornos,
      now() - interval '5 hours', now() + interval '30 days'),
    (v_nelida, 'necesito', null,
      (select id from rubros where nombre = 'Jardinería y poda'),
      'Cortar el pasto del fondo', 'Es un fondo chico. Pago al terminar.', 'A convenir',
      v_dorrego, now() - interval '3 days', now() + interval '27 days'),
    (v_miguel, 'necesito', null,
      (select id from rubros where nombre = 'Cuidado de personas (niños, adultos mayores)'),
      'Alguien que acompañe a mi mamá dos tardes',
      'Martes y jueves de 15 a 18. Zona centro o norte.', 'A convenir', null,
      now() - interval '1 day', now() + interval '29 days');
end;
$$;
