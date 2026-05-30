#!/usr/bin/env bash
# Push migraties naar remote Supabase via CLI.
#
# Aanbevolen in .env: SUPABASE_DB_URL (Session pooler, poort 6543)
# Alternatief: SUPABASE_DB_PASSWORD + DEV_SUPABASE_URL (direct, poort 5432 — werkt niet op elk netwerk)

set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_URL="${SUPABASE_DB_URL:-}"

if [ -z "$DB_URL" ]; then
  URL="${DEV_SUPABASE_URL:-}"
  PASSWORD="${SUPABASE_DB_PASSWORD:-}"

  if [ -z "$URL" ]; then
    echo "Fout: zet SUPABASE_DB_URL in .env, of DEV_SUPABASE_URL + SUPABASE_DB_PASSWORD"
    exit 1
  fi

  if [ -z "$PASSWORD" ]; then
    echo "Fout: SUPABASE_DB_PASSWORD ontbreekt (of gebruik SUPABASE_DB_URL)"
    echo "Dashboard → Settings → Database → Session pooler → URI (poort 6543)"
    exit 1
  fi

  REF="${URL#https://}"
  REF="${REF%%.supabase.co}"
  DB_URL="postgresql://postgres:${PASSWORD}@db.${REF}.supabase.co:5432/postgres"
  echo "Let op: directe verbinding (5432). Bij netwerkfouten: gebruik SUPABASE_DB_URL (pooler)."
fi

echo "Migraties pushen…"
supabase db push --db-url "$DB_URL" --yes
echo "Klaar."
