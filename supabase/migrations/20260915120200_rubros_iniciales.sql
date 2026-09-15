-- Rubros iniciales (requerimiento, sección 6).
-- Van en una migración y no en seed.sql porque son datos reales que también necesita producción.
-- De acá en adelante se editan como datos, nunca desde el código.
-- "Otros" existe siempre en cada familia y guarda el texto libre en publicaciones.rubro_otro_texto.

insert into public.rubros (familia, orden, nombre) values
  ('servicio',  1, 'Albañilería y construcción'),
  ('servicio',  2, 'Pintura'),
  ('servicio',  3, 'Electricidad y plomería'),
  ('servicio',  4, 'Gas y calefacción'),
  ('servicio',  5, 'Jardinería y poda'),
  ('servicio',  6, 'Limpieza (hogar y comercios)'),
  ('servicio',  7, 'Mudanzas y fletes'),
  ('servicio',  8, 'Peluquería y estética'),
  ('servicio',  9, 'Costura y arreglos de ropa'),
  ('servicio', 10, 'Cuidado de personas (niños, adultos mayores)'),
  ('servicio', 11, 'Mecánica y bicicletas'),
  ('servicio', 12, 'Clases y apoyo escolar'),
  ('servicio', 99, 'Otros'),
  ('producto',  1, 'Panadería y pastelería'),
  ('producto',  2, 'Carnicería y pollería'),
  ('producto',  3, 'Verdulería'),
  ('producto',  4, 'Comidas y viandas'),
  ('producto',  5, 'Almacén y despensa'),
  ('producto',  6, 'Artesanías'),
  ('producto',  7, 'Ropa y calzado'),
  ('producto', 99, 'Otros');
