#!/usr/bin/env bash
# Respaldo de la base de producción (paso 11.5, punto 8). Lo corre el equipo a mano, por ejemplo
# una vez por semana. Guarda el esquema y los datos en respaldos/ (fuera de git: tienen teléfonos).
#
#   ./scripts/respaldar.sh
#
# Necesita la Supabase CLI vinculada al proyecto de la nube (`supabase link`). Las fotos del
# Storage no entran en este respaldo.
set -euo pipefail

fecha=$(date +%Y-%m-%d)
mkdir -p respaldos
chmod 700 respaldos

supabase db dump --linked -f "respaldos/${fecha}-esquema.sql"
supabase db dump --linked --data-only -f "respaldos/${fecha}-datos.sql"
chmod 600 respaldos/"${fecha}"-*.sql

echo "Respaldo guardado en respaldos/${fecha}-*.sql. Guardalo en un lugar seguro y cifrado."
