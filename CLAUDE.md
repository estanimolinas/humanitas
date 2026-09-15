@AGENTS.md

# Humanitas — reglas para trabajar en este repo

Fuente de verdad: `docs/humanitas_requerimiento_mvp.md`. Si algo contradice ese documento, **frenar y preguntar**. No inventar features. Si algo del requerimiento parece mal, decirlo con la razón, pero no cambiarlo por cuenta propia.

## Territorio
El piloto es en la **ciudad de Santa Fe** (norte), provincia de Santa Fe. **No es para Buenos Aires** todavía. Ejemplos, textos, datos de prueba y características telefónicas van con Santa Fe (342). El sistema no pone límites geográficos (zonas por datos, 8.1).

## Restricción de costo
Todo en free tier. **$0 de infraestructura durante el piloto.** Ningún servicio, librería o plan pago sin preguntar antes (con el costo).

## Reglas no negociables
1. **Ningún DELETE** en ninguna tabla. Toda baja es `archivado_en` (R12). **Única excepción:** el script manual de poda borra filas de `eventos` *después* de agregarlas en `eventos_mensuales`. Ningún otro DELETE, en ningún lado.
2. **El teléfono nunca sale** en una respuesta de API ni en una pantalla. Solo se usa en el servidor para armar el link `wa.me` al tocar "Contactar", y solo para usuarios registrados (R04, R05).
3. **Orden del listado = sección 8.2, exactamente:** activas primero → `ultima_exposicion` ascendente (y se actualiza al servir la página) → empate: más reciente primero. Nada más: sin reputación, sin destacados, sin intervención manual.
4. **Zona ordena, NUNCA filtra (8.1).** Ni la zona de la persona registrada ni la cookie de zona del visitante pueden aparecer en un `WHERE`: solo en el `ORDER BY`. Grupos: misma zona → zona madre → resto (las publicaciones sin zona van en "resto").
5. **Contador de concretados** solo se incrementa desde el cierre de un *necesito* confirmado por la contraparte (8.4). Nunca se autoasigna.
6. **Límites anti-abuso (8.5) en el servidor**, no en el cliente: 3 publicaciones nuevas/día, 20 activas, 15 contactos/día, 2 denuncias de personas distintas → `en_revision`, un teléfono = una cuenta.
7. **Mirar no requiere registro.** El alta aparece solo al publicar o contactar y nunca pierde lo que la persona ya escribió (R01, B4).
8. **Sin push, sin scroll infinito, sin gamificación, sin tracking identificado de visitantes** (sección 16). Paginación con botón "Ver más".
9. **Fotos comprimidas en el cliente a < 200 KB** antes de subir, una por publicación (R03).
10. **UI en español rioplatense**, lenguaje simple, textos cortos, botones grandes.
11. **Tablas y campos exactamente como en 12.3.** Cualquier cambio de esquema se consulta antes.
12. Primera carga **< 300 KB** (medir con el build).

## Stack e infraestructura
- **Next.js** (App Router, TypeScript) en **Vercel Hobby**. **Tailwind**, sin librerías de UI pesadas.
- **Supabase Free**, usado SOLO como Postgres + Storage.
  - NO Supabase Auth, NO Edge Functions, NO Realtime, NO cron, NO add-ons.
  - Storage: un solo bucket `fotos`, lectura pública, escritura solo desde el servidor. Límite 1 GB.
  - DB: límite 500 MB. Nada de blobs ni logs crecientes. `eventos` es lo único que crece: índice por fecha y script manual de agregación/poda mensual.
- **Todo acceso a Supabase desde el servidor** (route handlers / server actions) con `SUPABASE_SERVICE_ROLE_KEY`. El cliente nunca habla con Supabase ni recibe ninguna key.
- **Auth propia (7.5, 12.1):** alta con nombre, teléfono (único, formato AR normalizado), zona opcional, aceptación de términos y declaración de mayoría de edad. Token aleatorio largo: hasheado en la DB y en claro en una cookie httpOnly de larga duración. Sin contraseña, SMS, mail ni link mágico. Recuperación manual por el operador (10.4).
- **PWA:** manifest + service worker que cachea assets y la última lista (R13). Sin push.
- **Monitoreo:** `/api/health` devuelve 200 (lo conecta un pinger externo gratuito).
- **Avisos WhatsApp (R20, R21):** semi-manuales. Un script en `scripts/` genera la lista de mensajes con links `wa.me`. NO integrar la API de WhatsApp Business.

## Servicios externos permitidos
| Servicio | Uso | Plan |
|---|---|---|
| Vercel | Hosting Next.js | Hobby (gratis) |
| Supabase | Postgres + Storage | Free |
| WhatsApp (`wa.me`) | Links de contacto y avisos enviados a mano | Gratis, sin API |
| Pinger de disponibilidad | Consulta `/api/health` | Gratuito, lo configura el usuario |
| GitHub | Repositorio público | Gratis |

**Prohibido sin consulta previa:** Sentry, analytics de terceros, CDN aparte, proveedores de email o SMS, colas, WhatsApp Business API, cualquier cosa paga.

## Desarrollo local primero
- Todo local hasta que el usuario diga que se deploya. Supabase local con la CLI (`supabase start` / `supabase stop`).
- Migraciones SQL en `supabase/migrations`: las mismas se aplican local y en la nube (`supabase db push`). Ningún paso que funcione solo en la nube.
- `.env.local` apunta al Supabase local; `.env.example` versionado sin valores. Deployar = cambiar valores, no código.

## Modelo de datos (12.3 + decisiones cerradas el 14/09/2026)
```
personas          id, nombre, telefono (único, normalizado AR), zona_id?,
                  verificado_por_referente_id?, verificado_en?, verificado_lugar?,
                  token_hash, terminos_aceptados_en, mayoria_edad_declarada (bool),
                  es_operador (bool), creada_en, archivado_en?
publicaciones     id, persona_id, tipo (ofrezco|necesito), subtipo (servicio|producto|null),
                  rubro_id, rubro_otro_texto?, titulo (≤60), descripcion? (≤500), precio_texto?,
                  alias_pago?, foto_url?, zona_id?, zona_otro_texto?,
                  estado (activa|cerrada|en_revision|archivada), cierre_motivo?, cerrada_en?,
                  ultima_exposicion, vence_en?, creada_en, actualizada_en, archivado_en?
contactos         id, publicacion_id, persona_solicitante_id, creada_en, archivado_en?
                  -- cada revelación de teléfono
concretados       id, publicacion_necesito_id, persona_que_hizo_id,
                  confirmado_por_persona_id, creada_en
                  -- solo desde cierre confirmado por la contraparte
zonas             id, nombre, tipo (provincia|localidad|barrio), parent_id?, lat?, lng?, archivado_en?
rubros            id, nombre, familia (servicio|producto), orden, activo, archivado_en?
referentes        id, persona_id, lugar, activo, alta_en, archivado_en?
denuncias         id, publicacion_id, persona_id?, motivo, detalle?, creada_en,
                  resuelta_en?, resolucion?, archivado_en?
eventos           id, tipo (vista|contacto|busqueda_sin_resultado|cierre), publicacion_id?,
                  rubro_id?, zona_id?, creada_en
                  -- sin persona_id; sin archivado_en: se agrega y se poda con script manual
acciones_operador id, operador_id → personas.id, accion, objetivo_tipo, objetivo_id, creada_en
                  -- registro público de toda intervención administrativa (P2)
eventos_mensuales mes, tipo, rubro_id?, zona_id?, cantidad
                  -- agregado de eventos; lo llena el script de poda (decisión 14/09/2026)
```
- `archivado_en` (timestamp nullable) en toda tabla que admite baja: personas, publicaciones, contactos, denuncias, referentes, rubros, zonas. No en `eventos`.
- Token de sesión: en claro **solo** en la cookie httpOnly; en la base **solo** `token_hash`.
- Operador = persona con `es_operador = true`. No hay tabla de admin separada.
- **La base hace cumplir las reglas:** los triggers `*_sin_delete` y `*_sin_truncate` rechazan DELETE/TRUNCATE en todas las tablas salvo `eventos`. RLS está activo sin políticas, y anon/authenticated no tienen permisos.
- Los rubros están en una migración (también van a producción). Las zonas de ejemplo están en `supabase/seed.sql` (solo local).
- Tests: `npm test` (Vitest contra Supabase local; los tests de base usan transacciones que siempre se deshacen).
- Motivos de denuncia (10.5): estafa, contenido inapropiado, posible menor (prioridad máxima, R16), otro.

## Decisiones de producto cerradas (14/09/2026)
- **Listado:** 10 por página con botón "Ver más".
- **Zona del visitante:** selector opcional guardado en una cookie sin identificador. Ordena, nunca filtra (regla 4).
- **Operador (R09):** página `/operador` solo para `es_operador`, con publicaciones `en_revision` y denuncias ("posible menor" arriba). El script de avisos incluye un mensaje `wa.me` al operador.
- **Referentes (R14):** página `/referente` para el referente logueado. Carga el teléfono de la persona presente, ve solo el nombre para confirmar y la marca verificada.
- **Recuperación (10.4):** el operador genera con un script un link de un solo uso que envía a mano por WhatsApp. Al usarlo, la sesión del dispositivo viejo se pierde.
- **Vencimientos (8.6):** `vence_en` se fija al crear o renovar (necesito +30 días, ofrezco +90). La query oculta lo vencido y un script manual actualiza el estado. Sin cron.
- **Peso:** 300 KB medidos **comprimidos** (bytes transferidos en la primera carga de `/`). Si se supera, **parar y avisar** antes de optimizar.
- **Términos y consentimiento:** texto borrador marcado "BORRADOR" hasta tener el definitivo.
- **Teléfono en el alta (15/09/2026):** **no se asume** característica. Se pide con característica, con ejemplo `342 512 3456` y ayuda clara. El número armado se muestra antes de guardar para que la persona confirme.
- **Tipografía (15/09/2026):** fuentes del sistema (al usuario le gustaron). Cero bytes de fuentes.
- **Guía visual:** la trae el usuario como HTML hecho con Claude Design. Se adapta a Tailwind respetando el presupuesto de 300 KB: sin CDNs ni fuentes externas.
- **Usabilidad primero (15/09/2026):** la web app tiene que ser lo más usable posible para el perfil de 4.2. Ante la duda, gana la opción más simple de entender y de tocar.
- **Encíclica:** toda cita es **textual** de la traducción oficial (vatican.va), con "León XIV, Magnifica Humanitas, N". Nunca parafrasear.
- **Node:** 22 LTS fijado en `.nvmrc` (`nvm use`). No tocar el Node global ni el alias default de nvm.
- **Tests:** Vitest (lógica y funciones SQL contra Supabase local). Sin Playwright.

## Forma de trabajo
- Un paso por vez, en el orden acordado. Al terminar cada paso, mostrar cómo se verifican los criterios de aceptación (secciones 9 y 15) con tests o pasos manuales concretos.
- Commits chicos con mensajes claros.
