# Dependencias y servicios

Todo lo que Humanitas necesita para funcionar, qué cuesta y por qué está. La regla del piloto es **$0 de infraestructura**: nada pago sin preguntar antes.

## Servicios externos

| Servicio | Para qué | Plan | Costo | Límites que importan |
|---|---|---|---|---|
| **Vercel** | Aloja la app (Next.js). Región San Pablo (`gru1`). | Hobby | $0 | Uso no comercial. Ancho de banda y ejecuciones del plan gratis. |
| **Supabase** | Postgres + Storage. Región San Pablo. | Free | $0 | Base de 500 MB, Storage de 1 GB. El proyecto se pausa después de una semana sin uso: lo evita un pinger sobre `/api/health`. |
| **GitHub** | Código fuente. Repositorio privado. | Free | $0 | — |
| **WhatsApp (`wa.me`)** | Links de contacto. | — | $0 | No se usa la API de WhatsApp Business. |
| **Pinger de disponibilidad** | Consulta `/api/health` cada pocos minutos. | Gratuito (a elegir) | $0 | Pendiente de configurar. |

**No se usan**, a propósito: Supabase Auth, Edge Functions, Realtime, cron, analytics de terceros, Sentry, CDN aparte, proveedores de mail o SMS, colas.

## Dependencias del código

Pocas y conocidas. Ninguna librería de componentes: la interfaz es Tailwind y componentes propios.

### Las que llegan a producción

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `next` | 16.3.5 | MIT | El framework: pantallas, servidor, server actions, proxy. |
| `react`, `react-dom` | 19.2.8 | MIT | La interfaz. |
| `@supabase/supabase-js` | 2.116.0 | MIT | Cliente de Postgres y Storage. **Solo en el servidor.** |
| `server-only` | 0.0.1 | MIT | Hace fallar el build si un módulo de servidor se importa en el navegador. |

### Las de desarrollo

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `typescript` | 5.9.3 | Apache-2.0 | Tipos. |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | MIT | Estilos. |
| `eslint`, `eslint-config-next` | 9.39.5 / 16.3.5 | MIT | Revisión del código. |
| `vitest` | 5.0.1 | MIT | Tests. |
| `postgres` | 3.4.9 | Unlicense | Conexión directa a la base, solo en los tests. |
| `@types/*` | — | MIT | Tipos de Node y React. |

### Recursos

| Recurso | Licencia | Cómo se usa |
|---|---|---|
| Letra **Lexend** | SIL Open Font License | `next/font` la descarga en el build y la sirve el propio dominio. El navegador nunca le pide nada a Google. |
| Dibujos de los oficios y símbolo | Propios del proyecto | `app/componentes/Oficio.tsx`, `app/icon.svg`, `public/icono-*.png`. |
| Citas de *Magnifica Humanitas* | Traducción oficial de vatican.va | Siempre textuales, con el número de párrafo. Los PDF no se redistribuyen. |

## Herramientas para desarrollar

| Herramienta | Versión | Para qué |
|---|---|---|
| Node | 22 LTS (fijado en `.nvmrc`) | `nvm use` en cada terminal. |
| Docker Desktop | — | Supabase local levanta contenedores. |
| Supabase CLI | 2.x | `supabase start`, `db reset`, `db push`. |
| GitHub CLI (`gh`) | — | Opcional, para crear y subir el repositorio. |

## Mantenerlas al día

- Antes de cada deploy: `npm run chequear:dependencias` (hace `npm audit`). El 19/09/2026 dio 0 vulnerabilidades.
- Actualizar Next.js leyendo primero su guía de actualización en `node_modules/next/dist/docs/`: la versión 16 cambió varias convenciones.
