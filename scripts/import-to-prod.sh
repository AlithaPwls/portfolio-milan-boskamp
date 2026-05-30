#!/usr/bin/env bash
# Importeert supabase/exported-from-dev.sql naar PRODUCTION

set -euo pipefail
cd "$(dirname "$0")/.."
SQL="${1:-supabase/exported-from-dev.sql}"

if [ ! -f "$SQL" ]; then
  echo "Fout: bestand niet gevonden: $SQL"
  echo "Run eerst: npm run db:export-dev"
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_URL="${PROD_SUPABASE_DB_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "Fout: PROD_SUPABASE_DB_URL ontbreekt in .env"
  exit 1
fi

echo "Importeren naar PRODUCTION uit $SQL …"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "Klaar. Controleer live site + upload Storage-afbeeldingen indien nodig."
