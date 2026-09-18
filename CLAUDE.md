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
- Los rubros están en una migración (también van a producción). Las zonas están en `supabase/seed.sql` (solo local): por ahora una sola, "Zona norte".
- Tests: `npm test` (Vitest contra Supabase local; los tests de base usan transacciones que siempre se deshacen).
- Motivos de denuncia (10.5): estafa, contenido inapropiado, posible menor (prioridad máxima, R16), otro.

## Decisiones de producto cerradas (14/09/2026)
- **Listado:** 10 por página con botón "Ver más".
- **Zona del visitante:** selector opcional guardado en una cookie sin identificador. Ordena, nunca filtra (regla 4).
- **Sin roles en la app (17/09/2026, decisión del usuario que cambia 4.3):** en la app hay **solo vecinos**. No existen las pantallas de operador ni de referente. Las tres funciones sensibles se hacen con **scripts** del equipo del piloto (paso 10):
  - resolver una denuncia (devolver al listado o archivar);
  - devolver el acceso a quien cambió de celular y lo pidió por el WhatsApp del equipo (10.4), con un link de un solo uso; al usarlo, la sesión vieja se pierde.
  Las funciones SQL (`resolver_revision`, `verificar_persona`), `personas.es_operador` y la tabla `referentes` **siguen en el esquema** y las usan los scripts.
- **Vencimientos (8.6):** `vence_en` se fija al crear o renovar (necesito +30 días, ofrezco +90). La query oculta lo vencido y un script manual actualiza el estado. Sin cron.
- **Peso:** 300 KB medidos **comprimidos** (bytes transferidos en la primera carga de `/`). Si se supera, **parar y avisar** antes de optimizar.
- **Términos y consentimiento:** texto borrador marcado "BORRADOR" hasta tener el definitivo.
- **Teléfono en el alta (15/09/2026):** **no se asume** característica. Se pide con característica, con ejemplo `342 512 3456` y ayuda clara. El número armado se muestra antes de guardar para que la persona confirme.
- **Tipografía (18/09/2026, reemplaza las decisiones del 15/09 y del 17/09):** **Lexend**, pensada para leer con fluidez, servida desde nuestro dominio (next/font la descarga en el build; nunca un CDN en uso). Es SIL OFL, gratis. No se usan Cormorant Garamond ni Lora: son difíciles de leer para quien lee poco.
- **Guía visual:** [docs/guia-visual.md](docs/guia-visual.md) (paleta, tamaños, componentes, textos, citas verificadas). Sale del mockup de Claude Design, pero **mandan el requerimiento y la usabilidad** (decisión 15/09/2026). Se aplica con Tailwind: sin CDNs ni fuentes externas.
- **Cómo se nombra el producto (17/09/2026, ajustado el 18/09/2026):** **no usar "tablón" ni "vecinos/vecinas"** en ningún texto que vea la gente. Humanitas es **una app para personas, entre personas**: para quien ofrece oportunidades de trabajo y para quien quiere trabajar. ("Vecinal" solo si se nombra una institución, y hoy no se nombra ninguna.)
- **Usabilidad primero (15/09/2026):** la web app tiene que ser lo más usable posible para el perfil de 4.2. Ante la duda, gana la opción más simple de entender y de tocar.
- **Encíclica (regla estricta, 15/09/2026):**
  - Comillas («» o “”) **solo** para citas textuales copiadas de la traducción oficial (vatican.va), siempre con "Magnifica Humanitas, N".
  - Una idea resumida con palabras propias va **sin comillas** y dice que es un resumen, por ejemplo "Inspirado en Magnifica Humanitas, 68".
  - **Nunca** atribuirle a la encíclica una frase que no está en el texto.
  - Antes de publicar una cita, verificarla contra el texto oficial.
- **Node:** 22 LTS fijado en `.nvmrc` (`nvm use`). No tocar el Node global ni el alias default de nvm.
- **Tests:** Vitest (lógica y funciones SQL contra Supabase local). Sin Playwright.

## Feedback de vecinos (18/09/2026)
- **Lema de la app:** "Tecnología al servicio de la humanidad". Va debajo del nombre en el encabezado y como descripción de la app instalada. Es una frase propia: sin comillas y sin atribuirla a la encíclica.
- **Letra mayúscula** en los textos de la app (títulos, botones, etiquetas, avisos, chips): en Argentina se alfabetiza primero con imprenta mayúscula. Se hace con estilo (`text-transform`), no reescribiendo el texto. Aplica a **todo**, también a lo que escriben los vecinos (confirmado 18/09): lo guardado en la base no cambia.
- **Vocabulario:** simple y pertinente, amable y profesional. Nada chocante, nada de órdenes ("hacé", "no pagues"), nada infantil.
- **Sin pantalla de valores:** las citas de la encíclica aparecen **en contexto**, donde son pertinentes (trabajo en el listado y en publicar, dignidad en el perfil, etc.). Siempre textuales, con su número.
- **Aviso de confianza** (texto elegido, se usa igual en todos lados): *Humanitas no percibe comisiones ni intermedia pagos. Los acuerdos económicos se establecen directamente entre las partes.* Visible en inicio, junto a Contactar, al publicar y en el alta.
- **Denuncias:** se mantienen como están. Las revisa una persona del equipo de Humanitas; ante un peligro se sugiere llamar al 911.
- **Tono (18/09/2026):** amable antes que correcto. Los errores dicen lo que falta con calidez ("Nos falta tu nombre", "Todavía falta elegir un rubro", "¿Lo acortamos?"). Los términos dicen primero lo que Humanitas **es** y después sus límites, sin cadenas de "no".
- **Sin puntos de alta ni instituciones (18/09/2026, decisión del usuario que cambia R14, 10.4 y 10.6):** es de personas entre personas. Ninguna institución (parroquia, vecinal, Estado) interviene en los acuerdos ni aparece en la app.
  - **Sin verificación presencial:** no se muestra "✓ Verificado en…" en ningún lado. `personas.verificado_*` y la tabla `referentes` quedan en el esquema sin usarse.
  - **Ayuda (`/ayuda`):** recuperar el acceso, ver los datos y darse de baja se piden al **WhatsApp del equipo** (`WHATSAPP_EQUIPO` en `.env.local`, solo servidor). El equipo lo resuelve con scripts.

## Alcance del MVP (17/09/2026)
El objetivo de esta etapa es **un MVP funcional para validar la idea con un [interno] de vecinos y presentarlo al [interno]**. Nada más. Ante la duda: **la app más simple posible**. Lo que se pueda hacer con un script del equipo, no se hace como pantalla.

## Prioridades que pidió el usuario (17/09/2026, al cerrar el día)
1. **Más seguridad** antes de exponerla: adelantar el endurecimiento (cabeceras, cerrar sesión, chequeo de secretos) y revisar el resto de la lista de 11.5.
2. **Mucho más fiel al mockup de Claude Design** (`docs/diseno/mockup-claude-design.html`). El motivo es de producto: **Humanitas tiene que ser lindo y tener impronta propia**. Que corra en **dispositivos de gama baja** es una restricción técnica (peso, contraste, tamaños), no una excusa para que se vea pobre. Concretamente:
   - **Tipografía:** Lexend (ver decisión del 18/09). Cuidar el presupuesto: hoy la primera carga son 185,5 KB de 300.
   - **Colores:** respetar los tokens del mockup, corrigiendo solo lo que no se lee (ver contrastes en `docs/guia-visual.md`).
   - **Citas de la encíclica:** en contexto, sin pantalla de valores (feedback del 18/09). Del mockup se toma el estilo: kicker dorado, cita destacada y número de párrafo.
   - Repasar pantalla por pantalla contra las capturas y acercar la composición, no solo la paleta. Siguen valiendo las decisiones A–I de contenido.
3. **Barrios (resuelto el 18/09/2026):** para el MVP hay **una sola zona, "Zona norte"** de la ciudad de Santa Fe. Los barrios se cargan más adelante.
   - Mientras tanto la app **no pregunta el barrio** en ningún lado: `ELEGIR_BARRIO = false` en `lib/zonas-config.ts` oculta el selector "Cómo se ordena", el barrio del alta, de Mis datos y de Editar, y el paso "¿Dónde?" de Publicar (queda en 2 pasos + alta si hace falta).
   - El esquema, la función de orden por zona (8.1) y sus tests siguen igual. Para volver a los barrios: cargar las zonas y poner el interruptor en `true`.

## Paso 11.5 — Endurecimiento antes del deploy (acordado 17/09/2026)
Va entre la PWA (paso 11) y el checklist de producción (paso 12):
1. Cabeceras de seguridad (CSP, Referrer-Policy, Permissions-Policy, anti-iframe).
2. Autorización en el servidor de toda pantalla privada (hoy solo Mis publicaciones).
3. Límite de altas por IP (los de 8.5 son por persona).
4. Cerrar sesión y rotación del token.
5. Chequeo automático de secretos (nada con prefijo público).
6. Supabase nube: apagar lo mismo que en local; evaluar cerrar la Data API.
7. `npm audit` y avisos de dependencias.
8. Backups: confirmar qué da el plan Free y dejar script propio.
9. Baja y anonimización del teléfono (Ley 25.326, 10.6).

**Pendiente de decisión del usuario:** el listado escribe en la base en cada visita (rotación 8.2), lo que permite que un robot genere escrituras. Mitigaciones posibles: no rotar en pedidos repetidos sin sesión desde la misma IP, o rotar como máximo una vez por minuto por publicación. Toca una regla del requerimiento, así que lo decide el usuario.

## Forma de trabajo
- Un paso por vez, en el orden acordado. Al terminar cada paso, mostrar cómo se verifican los criterios de aceptación (secciones 9 y 15) con tests o pasos manuales concretos.
- Commits chicos con mensajes claros.
