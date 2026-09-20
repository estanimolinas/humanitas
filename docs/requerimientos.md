# Requerimientos: qué está cumplido y dónde

El documento de requerimientos es interno y no está en este repositorio. Acá queda el cruce con el código: para cada requerimiento dice en qué estado está, dónde está hecho y qué test lo comprueba, más las decisiones que lo cambiaron.

Estado al 20/09/2026. 143 tests en `tests/` (`npm test`, contra Supabase local).

## P0: sin esto no se lanza

| ID | Requerimiento | Estado | Dónde | Test |
|---|---|---|---|---|
| R01 | Ver el listado sin registrarse | ✅ Cumplido | `app/page.tsx` | `listado.test.ts` (filtros del listado) |
| R02 | Publicar (ofrezco / necesito) sin perder lo escrito | ✅ Cumplido | `app/publicar/` | `publicar.test.ts` (R02, validación del formulario) |
| R03 | Foto comprimida en el celular a menos de 200 KB | ✅ Cumplido | `lib/comprimir-foto.ts`, `lib/publicar.ts` | `publicar.test.ts` (compresión de la foto); bucket en `esquema.test.ts` |
| R04 | Contactar por WhatsApp con mensaje prearmado | ✅ Cumplido | `app/p/[id]/acciones.ts`, función `registrar_contacto` | `contacto.test.ts` |
| R05 | El teléfono nunca se ve | ✅ Cumplido | `lib/personas.ts`, `lib/contactos.ts` | `alta.test.ts`, `listado.test.ts` (R05) |
| R06 | Mis publicaciones: cerrar y reactivar | ✅ Cumplido | `app/mis-publicaciones/`, función `cerrar_publicacion` | `mis-publicaciones.test.ts` |
| R07 | La zona ordena y no filtra | ✅ Cumplido en la base. El selector está oculto mientras haya una sola zona | función `listar_publicaciones`, `lib/zonas-config.ts` | `listado.test.ts` (R07) |
| R08 | Orden por rotación (8.2) | ✅ Cumplido, con rotación como máximo una vez por minuto por publicación (decisión 18/09) | función `listar_publicaciones` | `listado.test.ts` (R08), `seguridad-base.test.ts` |
| R09 | Denunciar: dos personas distintas ocultan | ⚠️ Parcial: oculta y queda registrado, pero el aviso al equipo y la resolución todavía no tienen script | función `registrar_denuncia` | `denuncias.test.ts` |
| R10 | Límites anti-abuso (8.5) | ✅ Cumplido, más límites por conexión (11.5) | funciones `crear_publicacion`, `registrar_contacto`, `registrar_intento` | `publicar.test.ts`, `contacto.test.ts`, `seguridad-base.test.ts` |
| R11 | Sesión persistente sin contraseña | ✅ Cumplido: cookie de 400 días, token renovado cada 30 | `lib/sesion/`, `proxy.ts` | `alta.test.ts` (R11), `seguridad-base.test.ts` |
| R12 | Nada se borra | ✅ Cumplido (excepciones: poda de `eventos` y `limites`) | triggers `*_sin_delete` | `esquema.test.ts` (R12) |
| R13 | Funciona con conexión lenta | ✅ Cumplido: 189 KB de 300, modo sin conexión. ⏳ Falta medir el "menos de 4 segundos en 3G" en producción | `public/sw.js`, `app/componentes/SinConexion.tsx` | medición con el build |
| R14 | Verificación presencial | ❌ Sacado por decisión (18/09): sin puntos de alta ni instituciones | — | — |
| R15 | Registro de eventos mínimos | ⏳ Pendiente: la tabla existe, todavía no se llena | tabla `eventos` | — |
| R16 | Mayores de 18 | ✅ Cumplido: el alta exige la declaración y "posible menor" es un motivo de denuncia | `lib/alta.ts`, `lib/denuncias.ts` | `alta.test.ts`, `esquema.test.ts` (R16) |

## P1 y P2

Ninguno está hecho. Esta versión cubre lo mínimo para que la app funcione:

- **R20 y R21** (avisos por WhatsApp): más adelante.
- **R22** (búsqueda por texto): cuando haya más de 200 publicaciones.
- **R23** (recuperar la cuenta): la resuelve el equipo por su WhatsApp (pantalla Ayuda). El script de devolución del acceso está pendiente.
- **R24** (panel del operador): no habrá pantallas de operador; esas tareas se hacen con scripts.
- **R25 y P2**: sin cambios.

## Decisiones que cambian el requerimiento

| Fecha | Decisión | Cambia |
|---|---|---|
| 17/09/2026 | En la app hay solo personas: sin pantallas de operador ni de referente. Esas tareas se hacen con scripts del equipo. | R24 |
| 17/09/2026 | Alcance acotado: la app más simple posible. | Alcance |
| 18/09/2026 | Sin puntos de alta ni instituciones: nadie interviene en los acuerdos. Sin verificación presencial. Ayuda y bajas por el WhatsApp del equipo. | R14, 10.3, 10.4, 10.6 |
| 18/09/2026 | No se usa la palabra "tablón" ni "vecinos": es una app para personas. | Textos |
| 18/09/2026 | Todo en mayúscula, letra Lexend, tono amable y citas de la encíclica en contexto. | Guía visual |
| 18/09/2026 | Una sola zona (norte de la ciudad de Santa Fe): la app no pregunta el barrio. | 7.3, 7.5 |
| 18/09/2026 | El listado rota cada publicación como máximo una vez por minuto, contra robots. | 8.2 |
| 18/09/2026 | Seguridad completa (paso 11.5): límites por conexión, renovación del token, baja con borrado de datos. | 11.5 |
| 19/09/2026 | Identidad propia: los oficios dibujados y el símbolo del encuentro. | Guía visual |

Los motivos de cada decisión están en [CLAUDE.md](../CLAUDE.md).

## Pendientes

1. **Scripts del equipo:** resolver una denuncia y devolver el acceso a quien cambió de celular. La baja ya está.
2. **Cuentas con números inventados:** mitigación pendiente de decisión ([seguridad.md](seguridad.md), al final).
3. **Términos definitivos:** hoy es un borrador, idealmente revisado por alguien de derecho.
4. **R15, registro de eventos:** todavía no se llena la tabla.
