#!/usr/bin/env bash
# Push migraties naar Supabase.
#   npm run db:push       → dev (SUPABASE_DB_URL)
#   npm run db:push:prod  → production (PROD_SUPABASE_DB_URL)

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="dev"
if [ "${1:-}" = "--prod" ]; then
  TARGET="production"
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ "$TARGET" = "production" ]; then
  DB_URL="${PROD_SUPABASE_DB_URL:-}"
  if [ -z "$DB_URL" ]; then
    echo "Fout: PROD_SUPABASE_DB_URL ontbreekt in .env"
    echo "Supabase production → Settings → Database → Session pooler → URI (poort 6543)"
    exit 1
  fi
  echo "Migraties pushen naar PRODUCTION…"
else
  DB_URL="${SUPABASE_DB_URL:-}"
  if [ -z "$DB_URL" ]; then
    URL="${DEV_SUPABASE_URL:-}"
    PASSWORD="${SUPABASE_DB_PASSWORD:-}"
    if [ -z "$URL" ] || [ -z "$PASSWORD" ]; then
      echo "Fout: SUPABASE_DB_URL of DEV_SUPABASE_URL + SUPABASE_DB_PASSWORD in .env"
      exit 1
    fi
    REF="${URL#https://}"
    REF="${REF%%.supabase.co}"
    DB_URL="postgresql://postgres:${PASSWORD}@db.${REF}.supabase.co:5432/postgres"
  fi
  echo "Migraties pushen naar DEV…"
fi

supabase db push --db-url "$DB_URL" --yes
echo "Klaar ($TARGET)."
