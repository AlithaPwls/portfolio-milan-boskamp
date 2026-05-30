#!/usr/bin/env bash
# Exporteert huidige content-tabellen van DEV naar supabase/exported-from-dev.sql

set -euo pipefail
cd "$(dirname "$0")/.."
OUT="supabase/exported-from-dev.sql"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_URL="${SUPABASE_DB_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "Fout: SUPABASE_DB_URL (dev pooler) ontbreekt in .env"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Fout: pg_dump niet gevonden (PostgreSQL client tools nodig)"
  exit 1
fi

cat > "$OUT" <<'HEADER'
-- AUTO-EXPORT uit DEV — importeer op PROD met: npm run db:import-prod
-- Let op: afbeeldingen in Storage worden niet meegekopieerd (upload opnieuw op prod of handmatig Storage).

DELETE FROM projects;
DELETE FROM skills;
DELETE FROM experiences;
DELETE FROM educations;
DELETE FROM site_settings WHERE id = 1;

HEADER

pg_dump "$DB_URL" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --table=public.site_settings \
  --table=public.projects \
  --table=public.skills \
  --table=public.experiences \
  --table=public.educations \
  >> "$OUT"

echo "Geschreven: $OUT"
echo "Daarna: npm run db:import-prod"
