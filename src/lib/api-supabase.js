// Everything the app reads and saves goes through here: the real database (Supabase).
// The preview uses api-sample.js, which has exactly the same functions.
import { SUPABASE_URL, SUPABASE_KEY, GOOGLE_SIGNIN, MAX_UPLOAD_MB } from '../config.js';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
});

function fail(error, fallback) {
  if (!error) return;
  console.error(error);
  const e = new Error(fallback || 'משהו השתבש. נסי שוב בעוד רגע.');
  e.cause = error;
  throw e;
}

function extOf(file) {
  const fromName = (file.name || '').split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== file.name) return fromName.toLowerCase();
  return (file.type.split('/')[1] || 'bin').replace('quicktime', 'mov');
}

function tooBig(file) {
  return file.size > MAX_UPLOAD_MB * 1024 * 1024;
}

// Short-lived links to private files, cached for a while.
const urlCache = new Map();
async function signedUrls(bucket, paths) {
  const now = Date.now();
  const missing = [...new Set(paths.filter(Boolean))].filter((p) => {
    const c = urlCache.get(bucket + '/' + p);
    return !c || c.until < now;
  });
  if (missing.length) {
    const { data, error } = await sb.storage.from(bucket).createSignedUrls(missing, 60 * 60 * 6);
    if (error) console.error(error);
    (data || []).forEach((d) => d.signedUrl && urlCache.set(bucket + '/' + d.path, { url: d.signedUrl, until: now + 1000 * 60 * 60 * 5 }));
  }
  const out = {};
  paths.forEach((p) => { const c = urlCache.get(bucket + '/' + p); if (c) out[p] = c.url; });
  return out;
}

let me = null; // { id, email }

export const api = {
  isPreview: false,
  googleEnabled: GOOGLE_SIGNIN,

  // ---------- Signing in ----------
  async init() {
    const { data } = await sb.auth.getSession();
    me = data.session ? { id: data.session.user.id, email: data.session.user.email } : null;
    return me;
  },
  onAuthChange(cb) {
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      me = session ? { id: session.user.id, email: session.user.email } : null;
      cb(me);
    });
    return () => data.subscription.unsubscribe();
  },
  async signInEmail(email) {
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error && /rate|seconds/i.test(error.message)) fail(error, 'שלחנו קישור לפני רגע. חכי דקה ונסי שוב.');
    fail(error, 'לא הצלחנו לשלוח את הקישור. בדקי את כתובת המייל ונסי שוב.');
  },
  async signInGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    fail(error, 'הכניסה עם Google לא הצליחה. נסי שוב, או היכנסי עם המייל.');
  },
  async signOut() {
    await sb.auth.signOut();
    me = null;
  },

  // ---------- Her profile ----------
  async loadMe() {
    if (!me) return null;
    const [{ data: profile, error }, { data: admin }] = await Promise.all([
      sb.from('profiles').select('id, email, display_name, avatar_path, status, activated_at').eq('id', me.id).maybeSingle(),
      sb.rpc('is_admin'),
    ]);
    fail(error);
    if (!profile) return { user: me, profile: { status: 'pending', display_name: '' }, isAdmin: !!admin };
    let avatar = null;
    if (profile.avatar_path) avatar = (await signedUrls('avatars', [profile.avatar_path]))[profile.avatar_path] || null;
    return {
      user: me,
      isAdmin: !!admin,
      profile: {
        id: profile.id, email: profile.email, name: profile.display_name || '', photo: avatar,
        status: profile.status, activatedAt: profile.activated_at ? new Date(profile.activated_at) : null,
      },
    };
  },
  async updateProfile({ name, photoFile }) {
    const patch = {};
    if (typeof name === 'string') patch.display_name = name.trim().slice(0, 60);
    if (photoFile) {
      if (tooBig(photoFile)) throw new Error('התמונה גדולה מדי. נסי תמונה אחרת.');
      const path = `${me.id}/avatar-${Date.now()}.${extOf(photoFile)}`;
      const { error } = await sb.storage.from('avatars').upload(path, photoFile, { contentType: photoFile.type, upsert: true });
      fail(error, 'לא הצלחנו להעלות את התמונה.');
      patch.avatar_path = path;
    }
    const { error } = await sb.from('profiles').update(patch).eq('id', me.id);
    fail(error, 'לא הצלחנו לשמור. נסי שוב.');
  },

  // ---------- The days (only open days ever arrive) ----------
  async loadDays() {
    const { data, error } = await sb.from('days').select('number, title, emoji, question, youtube_url, content').order('number');
    fail(error, 'לא הצלחנו לטעון את המסע. בדקי את החיבור לאינטרנט.');
    return (data || []).map((r) => ({
      ...(r.content || {}),
      number: r.number, title: r.title, emoji: r.emoji, question: r.question,
      video: { art: r.number, source: r.youtube_url ? { kind: 'link', url: r.youtube_url } : null },
    }));
  },
  async loadProgress() {
    const { data, error } = await sb.from('progress').select('day').eq('user_id', me.id);
    fail(error);
    return new Set((data || []).map((r) => r.day));
  },
  async setDone(day, done) {
    const q = done
      ? sb.from('progress').upsert({ user_id: me.id, day }, { onConflict: 'user_id,day', ignoreDuplicates: true })
      : sb.from('progress').delete().eq('user_id', me.id).eq('day', day);
    const { error } = await q;
    fail(error, 'לא הצלחנו לשמור. נסי שוב.');
  },

  // ---------- Her private space ----------
  async loadPrivate() {
    const { data, error } = await sb.from('private_items').select('kind, data, video_path, updated_at').eq('user_id', me.id);
    fail(error);
    const rows = Object.fromEntries((data || []).map((r) => [r.kind, r]));
    const paths = ['day1_video', 'day9_video'].map((k) => rows[k] && rows[k].video_path).filter(Boolean);
    const urls = paths.length ? await signedUrls('private-videos', paths) : {};
    const video = (k) => (rows[k] && rows[k].video_path ? { url: urls[rows[k].video_path], at: rows[k].updated_at } : null);
    return {
      day1Video: video('day1_video'),
      day9Video: video('day9_video'),
      answers: (rows.purpose_answers && rows.purpose_answers.data.answers) || {},
      ritual: (rows.ritual && rows.ritual.data.items) ? rows.ritual.data : null,
    };
  },
  async savePrivateVideo(kind, file) {
    if (tooBig(file)) throw new Error(`הסרטון גדול מדי (מעל ${MAX_UPLOAD_MB}MB). נסי סרטון קצר יותר, או צלמי באיכות רגילה.`);
    const path = `${me.id}/${kind}-${Date.now()}.${extOf(file)}`;
    const { error: upErr } = await sb.storage.from('private-videos').upload(path, file, { contentType: file.type || 'video/mp4' });
    fail(upErr, 'ההעלאה לא הצליחה. בדקי את החיבור ונסי שוב.');
    const { error } = await sb.from('private_items').upsert({ user_id: me.id, kind, video_path: path, updated_at: new Date().toISOString() });
    fail(error, 'לא הצלחנו לשמור את הסרטון.');
    const urls = await signedUrls('private-videos', [path]);
    return { url: urls[path], at: new Date().toISOString() };
  },
  async savePrivateData(kind, data) {
    const { error } = await sb.from('private_items').upsert({ user_id: me.id, kind, data, updated_at: new Date().toISOString() });
    fail(error, 'לא הצלחנו לשמור. נסי שוב.');
  },

  // ---------- Community ----------
  async loadFeed() {
    const { data, error } = await sb.from('feed').select('*').order('created_at', { ascending: false }).limit(150);
    fail(error, 'לא הצלחנו לטעון את הקהילה.');
    const rows = data || [];
    const mediaPaths = rows.flatMap((r) => (r.media || []).map((m) => m.path));
    const avatarPaths = rows.map((r) => r.author_avatar).filter(Boolean);
    const [mUrls, aUrls] = await Promise.all([
      mediaPaths.length ? signedUrls('community', mediaPaths) : {},
      avatarPaths.length ? signedUrls('avatars', avatarPaths) : {},
    ]);
    return rows.map((r) => ({
      id: r.id,
      author: { id: r.author_id, name: r.author_name || 'משתתפת', photo: r.author_avatar ? aUrls[r.author_avatar] : null },
      createdAt: new Date(r.created_at).getTime(),
      day: r.day, label: r.label, text: r.body,
      media: (r.media || []).map((m) => ({ type: m.kind, url: mUrls[m.path], duration: m.duration })),
      likes: r.like_count, likedByMe: r.liked_by_me, commentCount: r.comment_count,
      mine: r.author_id === (me && me.id),
    }));
  },
  async createPost({ text, day, label, files }) {
    for (const f of files) if (tooBig(f.file)) throw new Error(`הקובץ גדול מדי (מעל ${MAX_UPLOAD_MB}MB).`);
    const { data: post, error } = await sb.from('posts')
      .insert({ author_id: me.id, body: text || '', day: day || null, label: label || null })
      .select('id').single();
    fail(error, 'לא הצלחנו לפרסם. נסי שוב.');
    try {
      let i = 0;
      for (const f of files) {
        const path = `${me.id}/${post.id}/${i}-${Date.now()}.${extOf(f.file)}`;
        const { error: upErr } = await sb.storage.from('community').upload(path, f.file, { contentType: f.file.type });
        fail(upErr, f.kind === 'video' ? 'העלאת הסרטון לא הצליחה. בדקי את החיבור ונסי שוב.' : 'העלאת התמונה לא הצליחה.');
        const { error: mErr } = await sb.from('post_media').insert({
          post_id: post.id, kind: f.kind, path, sort: i,
          duration_seconds: f.duration || null, width: f.width || null, height: f.height || null,
        });
        fail(mErr);
        i++;
      }
    } catch (e) {
      // Don't leave a half-made post behind.
      await sb.from('posts').delete().eq('id', post.id);
      throw e;
    }
  },
  async deletePost(id) {
    const { error } = await sb.from('posts').delete().eq('id', id);
    fail(error, 'לא הצלחנו למחוק.');
  },
  async setLike(postId, liked) {
    const q = liked
      ? sb.from('likes').upsert({ post_id: postId, user_id: me.id }, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
      : sb.from('likes').delete().eq('post_id', postId).eq('user_id', me.id);
    const { error } = await q;
    fail(error);
  },
  async loadComments(postId) {
    const { data, error } = await sb.from('comments').select('id, author_id, body, created_at').eq('post_id', postId).order('created_at');
    fail(error, 'לא הצלחנו לטעון תגובות.');
    const ids = [...new Set((data || []).map((c) => c.author_id))];
    const { data: people } = ids.length ? await sb.from('members').select('id, display_name, avatar_path').in('id', ids) : { data: [] };
    const avatars = await signedUrls('avatars', (people || []).map((p) => p.avatar_path).filter(Boolean));
    const byId = Object.fromEntries((people || []).map((p) => [p.id, p]));
    return (data || []).map((c) => ({
      id: c.id, text: c.body, createdAt: new Date(c.created_at).getTime(), mine: c.author_id === me.id,
      author: { id: c.author_id, name: (byId[c.author_id] && byId[c.author_id].display_name) || 'משתתפת', photo: byId[c.author_id] && avatars[byId[c.author_id].avatar_path] },
    }));
  },
  async addComment(postId, text) {
    const { error } = await sb.from('comments').insert({ post_id: postId, author_id: me.id, body: text });
    fail(error, 'התגובה לא נשלחה. נסי שוב.');
  },
  async deleteComment(id) {
    const { error } = await sb.from('comments').delete().eq('id', id);
    fail(error, 'לא הצלחנו למחוק.');
  },

  // ---------- Library ----------
  async loadLibrary() {
    const { data, error } = await sb.from('library_items').select('*').order('sort');
    fail(error, 'לא הצלחנו לטעון את הספרייה.');
    return (data || []).map((r) => ({
      id: r.id, category: r.category, kind: r.kind, title: r.title, description: r.description, meta: r.meta,
      body: r.body, youtubeUrl: r.youtube_url, filePath: r.file_path,
    }));
  },
  async fileUrl(bucket, path) {
    if (!path) return null;
    return (await signedUrls(bucket, [path]))[path] || null;
  },
};
