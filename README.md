# Portfolio Milan Boskamp

Publieke portfolio website met een **verborgen admin** om content en design aan te passen zonder code. Gebouwd met HTML, CSS en vanilla JavaScript. Data, auth en bestanden via **Supabase**. Hosting via **Vercel**.

## Hoe de site werkt

| URL | Wie | Wat |
|-----|-----|-----|
| `/` | Iedereen | Publieke portfolio (hero, over mij, projecten, skills, ervaring, opleiding, contact) |
| `/admin` | Eigenaar | Inlogpagina (geen link op de publieke site) |
| `/admin/dashboard` | Ingelogde eigenaar | CMS om alles te beheren |

Alle content komt uit Supabase. Bezoekers hebben geen login nodig.

## Hoe de eigenaar inlogt

1. Ga naar de **production** website en typ handmatig `/admin` in de adresbalk (er is geen knop op de homepage).
2. Log in met het e-mailadres en wachtwoord dat de developer heeft aangemaakt in Supabase Auth.
3. Na inloggen kom je op `/admin/dashboard`.
4. Gebruik **Uitloggen** als je klaar bent.

**Belangrijk:** deel het wachtwoord nooit in e-mail of chat zonder beveiliging. Voor live content: altijd de **production** admin-URL gebruiken, niet de dev-preview.

## Wat de eigenaar wel en niet doet

| Wel | Niet |
|-----|------|
| Teksten, projecten, skills, ervaring, opleiding aanpassen | Code of bestanden op GitHub wijzigen |
| Kleuren, lettertype, button-radius instellen | Supabase-dashboard openen |
| Afbeeldingen uploaden via admin | Nieuwe admin-accounts aanmaken |
| Contact en social links bijwerken | Testdata op production zetten |

## Projectstructuur

```
index.html, style.css, script.js     → publieke site
admin/                               → login + dashboard
lib/config.js                        → Supabase URL/key (lokaal gegenereerd, niet in git)
lib/supabase.js                      → client + helpers
supabase/migrations/                 → SQL voor database
scripts/generate-config.js           → bouwt config.js bij Vercel deploy
```

## Supabase instellen

Je hebt **twee aparte Supabase-projecten** nodig:

| Project | Gebruik |
|---------|---------|
| `portfolio-dev` | Ontwikkeling en testen |
| `portfolio-production` | Live website + echte content |

### Stappen (herhaal voor elk project)

1. Maak het project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Database-schema aanmaken — **één van twee**:
   - **SQL Editor** (altijd werkend): voer in volgorde uit:
     - [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql)
     - [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql)
     - [`supabase/migrations/003_storage.sql`](supabase/migrations/003_storage.sql)
   - **CLI** (`npm run db:push`): zet in `.env` de **Session pooler** URI als `SUPABASE_DB_URL` (Dashboard → Settings → Database → Connect → Session pooler → URI, poort **6543**). Vervang `[YOUR-PASSWORD]` door je database-wachtwoord. Zie [`.env.example`](.env.example).
3. Onder **Authentication → Providers** zet **Email** aan.
4. Maak **één** gebruiker aan onder **Authentication → Users** (Add user) — dit is de admin/eigenaar.
5. Noteer onder **Settings → API** de **Project URL** en **anon public** key.

### Tabellen

- `site_settings` — één rij (`id = 1`): naam, hero, about, thema, contact, social, profielfoto-URL
- `projects` — portfolio-projecten
- `skills` — skills met categorie
- `experiences` — werkervaring
- `educations` — opleidingen

### RLS (Row Level Security)

- **SELECT:** iedereen (anon + ingelogd) mag lezen → publieke site werkt zonder login.
- **INSERT / UPDATE / DELETE:** alleen `authenticated` → alleen ingelogde admin.
- `site_settings`: geen extra INSERT; alleen UPDATE op rij `id = 1`.

Gebruik **nooit** de `service_role` key in frontend-code. Alleen de **anon** key in `lib/config.js`.

### Storage

- Bucket: `portfolio-images` (public read)
- Uploads via admin → profiel (`profile/…`) en projecten (`projects/…`)
- Alleen ingelogde users mogen uploaden/wijzigen/verwijderen

## Dev vs production

| Git branch | Vercel | Supabase |
|------------|--------|----------|
| `dev` | Preview deployment | portfolio-dev |
| `main` | Production | portfolio-production |

**Workflow:**

1. Werk en test op branch `dev` → Vercel Preview + dev-database.
2. Test admin en publieke site op de preview-URL.
3. Merge `dev` → `main` als alles goed is.
4. Production deployment gebruikt automatisch de prod Supabase-keys.
5. Eigenaar past **live content** alleen aan via production `/admin`.

Testdata hoort **niet** in production.

## Lokaal ontwikkelen

```bash
# 1. Kopieer env-voorbeeld
cp .env.example .env
# Vul DEV_SUPABASE_URL en DEV_SUPABASE_ANON_KEY in

# 2. Genereer config
npm run config:local

# 3. (eenmalig) migraties naar dev-database
#    Zet SUPABASE_DB_URL in .env (pooler URI, zie .env.example)
npm run db:push

# 4. Start een static server
npx serve .
```

Open `http://localhost:3000` en `http://localhost:3000/admin`.

Alternatief zonder `.env`:

```bash
cp lib/config.example.js lib/config.js
# Bewerk lib/config.js met je dev URL en anon key
```

## Deployen naar Vercel

1. Koppel de Git-repo aan Vercel.
2. Stel branches in: **Production** = `main`, **Preview** = `dev` (of alle niet-main branches).
3. Voeg environment variables toe:

| Variabele | Environment |
|-----------|-------------|
| `DEV_SUPABASE_URL` | Preview |
| `DEV_SUPABASE_ANON_KEY` | Preview |
| `PROD_SUPABASE_URL` | Production |
| `PROD_SUPABASE_ANON_KEY` | Production |

4. Bij deploy draait `npm run build` → schrijft `lib/config.js` uit de juiste vars (`VERCEL_ENV=production` → PROD_*, anders DEV_*).
5. `vercel.json` zorgt voor routes `/admin` en `/admin/dashboard`.

## Security checklist

- [ ] Anon key in frontend is OK; service role **niet** in repo
- [ ] RLS aan op alle tabellen + storage
- [ ] Dashboard redirect zonder sessie
- [ ] Geen link naar `/admin` op publieke pagina
- [ ] `lib/config.js` in `.gitignore`
- [ ] Eén admin-account per Supabase-project

## Technische stack

- HTML, CSS, vanilla JavaScript
- Supabase JS v2 (CDN UMD)
- Geen React, geen frameworks, geen bundler (alleen config-generatie bij deploy)
