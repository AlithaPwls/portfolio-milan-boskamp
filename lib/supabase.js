/**
 * Supabase client en gedeelde data-helpers.
 * Vereist: window.PORTFOLIO_CONFIG, window.supabase (UMD CDN)
 */

const BUCKET = 'portfolio-images';

let client = null;

function getConfig() {
  if (!window.PORTFOLIO_CONFIG?.supabaseUrl || !window.PORTFOLIO_CONFIG?.supabaseAnonKey) {
    throw new Error('Supabase config ontbreekt. Genereer lib/config.js of kopieer config.example.js.');
  }
  return window.PORTFOLIO_CONFIG;
}

function getClient() {
  if (client) return client;
  if (!window.supabase?.createClient) {
    throw new Error('Supabase library niet geladen.');
  }
  const cfg = getConfig();
  client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  return client;
}

async function getSession() {
  const { data, error } = await getClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

async function signIn(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

function onAuthChange(callback) {
  return getClient().auth.onAuthStateChange((_event, session) => callback(session));
}

/** Publieke content voor homepage */
async function fetchPublicContent() {
  const sb = getClient();
  const [settingsRes, projectsRes, skillsRes, experiencesRes, educationsRes, activitiesRes] =
    await Promise.all([
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    sb.from('projects').select('*').order('sort_order', { ascending: true }),
    sb.from('skills').select('*').order('sort_order', { ascending: true }),
    sb.from('experiences').select('*').order('sort_order', { ascending: true }),
    sb.from('educations').select('*').order('sort_order', { ascending: true }),
    sb.from('activities').select('*').order('date', { ascending: false }).order('sort_order', { ascending: true }),
  ]);

  const errors = [
    settingsRes.error,
    projectsRes.error,
    skillsRes.error,
    experiencesRes.error,
    educationsRes.error,
    activitiesRes.error,
  ].filter(Boolean);

  if (errors.length) throw errors[0];

  return {
    settings: settingsRes.data,
    projects: projectsRes.data || [],
    skills: skillsRes.data || [],
    experiences: experiencesRes.data || [],
    educations: educationsRes.data || [],
    activities: activitiesRes.data || [],
  };
}

/** Eén project + site-instellingen voor detailpagina */
async function fetchProjectById(id) {
  const sb = getClient();
  const [settingsRes, projectRes] = await Promise.all([
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    sb.from('projects').select('*').eq('id', id).maybeSingle(),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (projectRes.error) throw projectRes.error;

  return {
    settings: settingsRes.data,
    project: projectRes.data,
  };
}

async function updateSiteSettings(updates) {
  const { data, error } = await getClient()
    .from('site_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchTable(table, orderBy = { column: 'sort_order', ascending: true }) {
  const { data, error } = await getClient()
    .from(table)
    .select('*')
    .order(orderBy.column, { ascending: orderBy.ascending });
  if (error) throw error;
  return data || [];
}

async function insertRow(table, row) {
  const { data, error } = await getClient().from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateRow(table, id, row) {
  const { data, error } = await getClient().from(table).update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteRow(table, id) {
  const { error } = await getClient().from(table).delete().eq('id', id);
  if (error) throw error;
}

/** Upload naar Storage; retourneert public URL */
async function uploadImage(file, folder) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await getClient().storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = getClient().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

window.PortfolioDB = {
  BUCKET,
  getClient,
  getSession,
  signIn,
  signOut,
  onAuthChange,
  fetchPublicContent,
  fetchProjectById,
  updateSiteSettings,
  fetchTable,
  insertRow,
  updateRow,
  deleteRow,
  uploadImage,
};
