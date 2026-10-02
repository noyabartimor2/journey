// Editable site texts (the sales page). Everyone can read them; only admins can save.
// The admin is recognised by her normal JOURNEY sign-in (same site, same session).
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Preview mode (#edit-preview): try the editor without an account; nothing is saved.
const preview = /edit-preview/.test(location.hash);

export const siteApi = {
  preview,

  async load(key) {
    if (!sb) return null;
    const { data, error } = await sb.from('site_texts').select('value').eq('key', key).maybeSingle();
    if (error) { console.warn(error); return null; }
    return data ? data.value : null;
  },

  async canEdit() {
    if (preview) return true;
    if (!sb) return false;
    const { data: s } = await sb.auth.getSession();
    if (!s.session) return false;
    const { data } = await sb.rpc('is_admin');
    return !!data;
  },

  async save(key, value) {
    if (preview) { await new Promise((r) => setTimeout(r, 300)); return; }
    const { error } = await sb.from('site_texts').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) { console.error(error); throw new Error('לא הצלחנו לשמור את השינויים. נסי שוב.'); }
  },
};
