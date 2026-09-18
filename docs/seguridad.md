# Seguridad de Humanitas

Qué protege la app, cómo se verifica y qué queda por hacer al deployar. Es el paso 11.5 del plan, completo, más la auditoría final.

## Qué está hecho

| # | Medida | Dónde | Cómo se verifica |
|---|---|---|---|
| 1 | **Cabeceras de seguridad.** CSP con un nonce nuevo en cada pedido: solo corren los scripts de la app. También anti-iframe, `nosniff`, Referrer-Policy, Permissions-Policy, HSTS y COOP. | `proxy.ts`, `next.config.ts`, `lib/seguridad/cabeceras.ts` | `tests/seguridad.test.ts`; `curl -I` sobre cualquier pantalla |
| 2 | **Permisos en el servidor.** Cada acción comprueba quién la pide y que lo que toca sea suyo. Los ids se validan antes de ir a la base. Las pantallas muestran solo sus propios mensajes, nunca un texto que venga en la URL. | `app/**/acciones.ts`, `lib/ids.ts` | `tests/mis-publicaciones.test.ts`, `tests/seguridad.test.ts` |
| 3 | **Límites por conexión.** Hasta 30 cuentas nuevas y 20 denuncias sin cuenta por día y por conexión. La IP se guarda como hash con sal, nunca en claro. Se suman a los límites por persona de 8.5. | `lib/limites.ts`, tabla `limites` | `tests/seguridad-base.test.ts` |
| 4 | **Sesión.** Token de 256 bits; en la base solo su hash. Cerrar sesión invalida el token. El token se renueva solo cada 30 días. | `lib/personas.ts`, `lib/sesion/`, `proxy.ts` | `tests/seguridad-base.test.ts` |
| 5 | **Secretos.** Ninguna variable con `NEXT_PUBLIC_`. Ningún componente del navegador importa código de servidor. `.env.local` fuera de git. Después del build se revisa que la key no esté en lo que baja al navegador. | `tests/seguridad.test.ts`, `scripts/chequear-secretos.mjs` | `npm test`, `npm run build && npm run chequear:secretos` |
| 6 | **Supabase.** Solo Postgres y Storage. RLS activo sin políticas y ningún permiso para `anon` ni `authenticated`: con la key pública no se lee ni se escribe nada. No se borran filas (triggers). | migraciones | `tests/esquema.test.ts` |
| 7 | **Dependencias.** Sin vulnerabilidades conocidas (18/09/2026: 0). | `package-lock.json` | `npm run chequear:dependencias` |
| 8 | **Respaldos.** Script propio que guarda esquema y datos en `respaldos/`, fuera de git. | `scripts/respaldar.sh` | correrlo después del deploy |
| 9 | **Baja (Ley 25.326).** A pedido, el equipo borra el teléfono, el nombre, los textos y las fotos de la persona, e invalida su sesión. Queda registrado. | `scripts/dar-de-baja.mjs`, función `dar_de_baja` | `tests/seguridad-base.test.ts` |
| — | **Listado contra robots.** Cada publicación rota como máximo una vez por minuto (8.2): recargar la página no genera escrituras sin fin. | `listar_publicaciones` | `tests/seguridad-base.test.ts` |

## Checklist al crear el proyecto en Supabase (nube)

La Data API **no se puede cerrar**: la app la usa, desde el servidor y con la service role key. Lo que sí se hace es dejarla inútil para cualquier otra persona:

- [ ] Aplicar las migraciones con `supabase db push`. Traen RLS, los `revoke` y los triggers.
- [ ] En **API → Exposed schemas**, dejar solo `public`.
- [ ] En **Database → Extensions**, apagar `pg_graphql` si está prendida (no se usa).
- [ ] En **Authentication**, apagar el registro de usuarios (no se usa Supabase Auth).
- [ ] La **service role key** va solo en Vercel (Environment Variables), nunca en el código ni en el chat.
- [ ] Cargar `SAL_IP` en Vercel con un valor largo al azar (`openssl rand -hex 32`).
- [ ] Confirmar en el panel qué respaldos da el plan Free. Mientras tanto, correr `npm run respaldar` una vez por semana y guardar el archivo cifrado.
- [ ] Bucket `fotos`: lectura pública, tamaño máximo 200 KB, solo JPG y WEBP (lo crea la migración; verificar en el panel).

## Tareas periódicas del equipo

- `npm run respaldar`: una vez por semana.
- `npm run podar:limites`: una vez por mes.
- `npm run chequear:dependencias`: antes de cada deploy.
- `npm run baja -- "<celular>" "<celular de quien opera>"`: cuando alguien pide la baja.
