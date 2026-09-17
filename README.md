# Humanitas

App para vecinos y vecinas del norte de la ciudad de Santa Fe, Argentina: quien ofrece oportunidades de trabajo y quien quiere trabajar se encuentran. Es una PWA: se usa desde el navegador del celular y no hace falta instalar nada.

- Requerimiento (fuente de verdad): [docs/humanitas_requerimiento_mvp.md](docs/humanitas_requerimiento_mvp.md)
- Reglas para desarrollar: [CLAUDE.md](CLAUDE.md)

> README inicial. La versión completa (scripts, operación y checklist de pasar a producción) se escribe en el paso 12.

## Requisitos

- **nvm** con **Node 22**. La versión está fijada en `.nvmrc`; no hace falta cambiar el Node global.
- **Docker Desktop** corriendo, porque Supabase local levanta contenedores.
- **Supabase CLI**: `brew install supabase/tap/supabase`.

No hace falta cuenta de Supabase ni de Vercel para desarrollar: todo corre local.

## Levantar el proyecto en local

```bash
nvm install          # la primera vez: instala la versión de .nvmrc
nvm use              # cada vez que abrís una terminal nueva
npm install

supabase start       # levanta Postgres + Storage locales (la primera vez descarga imágenes)
```

Creá `.env.local`. Como Supabase Auth está apagado, `supabase status` no muestra la service role key: se lee del contenedor de Storage.

```bash
KEY=$(docker inspect supabase_storage_humanitas --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^SERVICE_KEY=//p')
printf 'SUPABASE_URL=http://127.0.0.1:54321\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$KEY" > .env.local
```

Esa key es la de demo que trae Supabase local y no sirve fuera de tu máquina. En producción se usa la del proyecto en la nube (checklist del paso 12).

```bash
npm run dev          # http://localhost:3000
```

## Detener Supabase local

```bash
supabase stop        # detiene los contenedores y conserva los datos
```

Para volver la base a cero, con migraciones y seed aplicados de nuevo: `supabase db reset`.

## Base de datos y tests

- Migraciones: [supabase/migrations](supabase/migrations). Son las mismas en local y en la nube.
- Seed local (zonas de ejemplo): [supabase/seed.sql](supabase/seed.sql). Los rubros van en una migración porque producción también los necesita.

```bash
supabase db reset    # aplica migraciones y seed desde cero
npm test             # tests contra Supabase local
```

Los tests leen `.env.local`, así que primero tiene que estar creado. Los tests de esquema no dejan datos. Los de alta crean personas de prueba con números `549342999…`, y `supabase db reset` las limpia.

## Qué usamos de Supabase

Solo **Postgres** y **Storage**. Auth, Realtime, Edge Functions, Analytics, SMTP y el resto están apagados en [supabase/config.toml](supabase/config.toml). Todo acceso a la base es desde el servidor de Next.js; el navegador nunca habla con Supabase.

Supabase Studio (la interfaz web para mirar la base) queda disponible en local en http://127.0.0.1:54323.
