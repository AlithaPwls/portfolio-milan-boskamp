/**
 * Genereert lib/config.js uit environment variables.
 * Vercel: production → PROD_*, preview/dev → DEV_*
 * Lokaal: --local leest .env of DEV_* uit process.env
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'lib', 'config.js');

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function pickConfig() {
  const isLocal = process.argv.includes('--local');
  const vercelEnv = process.env.VERCEL_ENV;

  if (isLocal) {
    loadDotEnv();
    return {
      supabaseUrl: process.env.DEV_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.DEV_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      envLabel: 'local-dev',
    };
  }

  if (vercelEnv === 'production') {
    return {
      supabaseUrl: process.env.PROD_SUPABASE_URL,
      supabaseAnonKey: process.env.PROD_SUPABASE_ANON_KEY,
      envLabel: 'production',
    };
  }

  return {
    supabaseUrl: process.env.DEV_SUPABASE_URL,
    supabaseAnonKey: process.env.DEV_SUPABASE_ANON_KEY,
    envLabel: vercelEnv || 'preview',
  };
}

function main() {
  const { supabaseUrl, supabaseAnonKey, envLabel } = pickConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Ontbrekende Supabase config. Zet DEV_SUPABASE_URL + DEV_SUPABASE_ANON_KEY (preview/local) of PROD_* (production).'
    );
    process.exit(1);
  }

  const content = `// AUTO-GENERATED — niet handmatig bewerken (${envLabel})
window.PORTFOLIO_CONFIG = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
};
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, content, 'utf8');
  console.log(`config.js geschreven (${envLabel})`);
}

main();
