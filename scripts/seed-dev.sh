#!/usr/bin/env bash
# Vult dev-database met voorbeeldcontent (student bouwkundig tekenen).

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
  echo "Fout: SUPABASE_DB_URL ontbreekt in .env"
  exit 1
fi

echo "Dev seed laden…"

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed-dev.sql
else
  # Fallback: elk SQL-blok apart (supabase db query ondersteunt geen multi-statement)
  awk 'BEGIN{RS=";\n"} NF{print $0";"}' supabase/seed-dev.sql | while IFS= read -r block; do
    trimmed=$(echo "$block" | sed '/^[[:space:]]*$/d' | sed '/^--/d')
    [ -z "$trimmed" ] && continue
    supabase db query --db-url "$DB_URL" "$block"
  done
fi

echo "Klaar. Vernieuw http://localhost:5173/ — bewerk via /admin/dashboard"
