-- Bucket único "fotos": lectura pública, escritura solo desde el servidor (service role).
-- Sin políticas sobre storage.objects para anon/authenticated: nadie más puede subir ni borrar.
-- Las fotos llegan comprimidas en el cliente a < 200 KB (R03); el límite del bucket es la red de
-- seguridad del servidor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 204800, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;
