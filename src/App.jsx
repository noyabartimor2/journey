import { purposeQuestions } from './data/days.js';
import { currentDay, israelHour, TOTAL_DAYS } from './lib/schedule.js';
import { AppContext } from './lib/context.js';
import { Avatar, Sheet, Icon } from './components/ui.jsx';
import { DayPage } from './components/DayPage.jsx';
import { RitualCard } from './components/widgets.jsx';
import { Journey } from './screens/Journey.jsx';
import { Community, ComposeSheet, CommentsSheet } from './screens/Community.jsx';
import { Library, LibrarySheet } from './screens/Library.jsx';
import { Home } from './screens/Home.jsx';
import { SignIn, Waiting, Closed, Loading } from './screens/Gate.jsx';
import { EditBar, useUnsavedWarning } from './components/edit.jsx';
import { clean } from './lib/content.js';
const { useState, useMemo, useEffect, useCallback, useRef } = React;

const TABS = [
  { id: 'home', label: 'בית' },
  { id: 'today', label: 'היום' },
  { id: 'journey', label: 'המסע' },
  { id: 'community', label: 'קהילה' },
  { id: 'library', label: 'ספרייה' },
];

function firstName(name) { return (name || '').trim().split(/\s+/)[0] || ''; }

function greeting(now, name) {
  const h = israelHour(now);
  const n = name ? `, ${name}` : '';
  if (h >= 5 && h < 12) return `בוקר טוב${n} ☀️`;
  if (h >= 12 && h < 17) return `צהריים טובים${n}`;
  if (h >= 17 && h < 22) return `ערב טוב${n}`;
  return `לילה טוב${n}`;
}

function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
  }, []);
  return [msg, show];
}

export function App({ api }) {
  const [user, setUser] = useState(undefined);      // undefined = still checking
  const [me, setMe] = useState(null);               // { profile, isAdmin }
  const [loadError, setLoadError] = useState('');
  const [loadDetail, setLoadDetail] = useState('');     // technical reason, shown small for support
  const [now, setNow] = useState(() => new Date());
  const [version, setVersion] = useState(0);        // bump to reload everything

  const [days, setDays] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [personal, setPersonal] = useState({ day1Video: null, day9Video: null, answers: {}, ritual: null });
  const [posts, setPosts] = useState([]);
  const [feedState, setFeedState] = useState({ loading: true, error: '' });
  const [library, setLibrary] = useState([]);
  const [libLoading, setLibLoading] = useState(true);

  const [tab, setTab] = useState('home');
  const [openDay, setOpenDay] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [toast, showToast] = useToast();

  // Content editing (admins; everyone in the preview). drafts: { [dayNumber]: edited day }
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [saveState, setSaveState] = useState({ saving: false, error: '' });
  const changedCount = Object.keys(drafts).length;
  useUnsavedWarning(changedCount > 0);

  // Sign-in state
  useEffect(() => {
    let alive = true;
    api.init().then((u) => alive && setUser(u)).catch(() => alive && setUser(null));
    const off = api.onAuthChange((u) => { setUser(u); setVersion((v) => v + 1); });
    return () => { alive = false; off(); };
  }, []);

  // The clock: re-check every minute, so 08:00 opens the next day even if the app is open.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const refreshMe = useCallback(async () => {
    try { setMe(await api.loadMe()); setLoadError(''); setLoadDetail(''); }
    catch (e) { setLoadError(e.message); const c = e.cause || {}; setLoadDetail([c.code, c.message || (e.cause ? String(e.cause) : ''), c.hint].filter(Boolean).join(' · ')); }
  }, [api]);

  useEffect(() => { if (user) refreshMe(); else setMe(null); }, [user, version]);

  const profile = me && me.profile;
  const isAdmin = !!(me && me.isAdmin);
  const approved = !!(profile && profile.status === 'approved' && profile.activatedAt);
  // Admins can always get in and see all 9 days (to manage the content).
  const hasAccess = approved || isAdmin;
  const today = isAdmin ? TOTAL_DAYS : approved ? currentDay(profile.activatedAt, now) : 0;
  const canEdit = isAdmin || !!api.isPreview;

  const loadFeed = useCallback(async () => {
    setFeedState((s) => ({ ...s, loading: true }));
    try { setPosts(await api.loadFeed()); setFeedState({ loading: false, error: '' }); }
    catch (e) { setFeedState({ loading: false, error: e.message }); }
  }, [api]);

  // Load her journey (again whenever a new day opens).
  useEffect(() => {
    if (!hasAccess) return;
    let alive = true;
    (async () => {
      try {
        const [d, p, priv] = await Promise.all([api.loadDays(), api.loadProgress(), api.loadPrivate()]);
        if (!alive) return;
        setDays(d); setCompleted(p); setPersonal(priv); setLoadError('');
      } catch (e) { if (alive) setLoadError(e.message); }
    })();
    loadFeed();
    setLibLoading(true);
    api.loadLibrary().then((l) => { if (alive) { setLibrary(l); setLibLoading(false); } }).catch(() => alive && setLibLoading(false));
    return () => { alive = false; };
  }, [hasAccess, today, version]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  // ---------- Actions ----------
  const setDone = async (n, done) => {
    setCompleted((s) => { const c = new Set(s); done ? c.add(n) : c.delete(n); return c; });
    try { await api.setDone(n, done); }
    catch (e) {
      setCompleted((s) => { const c = new Set(s); done ? c.delete(n) : c.add(n); return c; });
      showToast(e.message);
    }
  };
  const saveVideo = async (kind, file) => {
    const v = await api.savePrivateVideo(kind, file);
    setPersonal((p) => ({ ...p, [kind === 'day1_video' ? 'day1Video' : 'day9Video']: v }));
  };
  const saveData = async (kind, data) => {
    await api.savePrivateData(kind, data);
    setPersonal((p) => (kind === 'purpose_answers' ? { ...p, answers: data.answers } : { ...p, ritual: data }));
  };
  const like = async (post) => {
    const liked = !post.likedByMe;
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likedByMe: liked, likes: p.likes + (liked ? 1 : -1) } : p)));
    try { await api.setLike(post.id, liked); }
    catch (e) {
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likedByMe: !liked, likes: p.likes + (liked ? -1 : 1) } : p)));
      showToast(e.message);
    }
  };
  const publish = async (data) => {
    await api.createPost(data);           // errors are shown inside the sheet
    setSheet(null); setOpenDay(null); setTab('community');
    showToast('שיתפת ✓');
    loadFeed();
  };
  const removePost = async (post) => {
    try { await api.deletePost(post.id); setPosts((ps) => ps.filter((p) => p.id !== post.id)); }
    catch (e) { showToast(e.message); }
  };
  const editDay = (d) => setDrafts((ds) => ({ ...ds, [d.number]: d }));
  const discardEdits = () => { setDrafts({}); setSaveState({ saving: false, error: '' }); };
  const saveEdits = async () => {
    setSaveState({ saving: true, error: '' });
    try {
      for (const d of Object.values(drafts)) {
        await api.saveDay(d);
        setDays((all) => all.map((x) => (x.number === d.number ? clean(d) : x)));
        setDrafts((ds) => { const c = { ...ds }; delete c[d.number]; return c; });
      }
      setSaveState({ saving: false, error: '' });
      showToast('השינויים נשמרו ✓');
    } catch (e) { setSaveState({ saving: false, error: e.message }); }
  };
  const exitEdit = () => { setEditMode(false); discardEdits(); };

  const signOut = async () => { setSheet(null); await api.signOut(); setUser(null); setTab('home'); };

  const shareCount = (n) => posts.filter((p) => p.mine && p.day === n && p.label).length;
  const ctx = useMemo(() => ({ api, isPreview: api.isPreview }), [api]);
  const dayByNumber = Object.fromEntries(days.map((d) => [d.number, drafts[d.number] || d]));
  const myName = firstName(profile && profile.name);

  const dayProps = {
    today, completed, personal, shareCount,
    onComplete: (n) => setDone(n, true), onUndo: (n) => setDone(n, false),
    onShare: (day) => setSheet({ type: 'compose', day }),
    onSaveVideo: saveVideo, onSaveData: saveData,
    editing: editMode, onEdit: editDay,
    onGoCommunity: () => { setOpenDay(null); setTab('community'); },
  };

  // ---------- Preview tool ----------
  const previewButton = api.preview && (
    <button className={`preview-pill ${!approved ? 'on-gate' : ''}`} onClick={() => setSheet({ type: 'preview' })}>תצוגה מקדימה</button>
  );
  const previewSheet = sheet && sheet.type === 'preview' && (
    <PreviewSheet api={api} onClose={() => setSheet(null)} onChanged={() => { setSheet(null); setTab('home'); setOpenDay(null); setVersion((v) => v + 1); }} />
  );

  // ---------- Screens before the journey ----------
  let gate = null;
  if (user === undefined || (user && !me && !loadError)) gate = <Loading />;
  else if (!user) gate = <SignIn />;
  else if (loadError && !me) gate = <ErrorScreen message={loadError} detail={loadDetail} onRetry={() => setVersion((v) => v + 1)} />;
  else if (profile.status === 'blocked') gate = <Closed onSignOut={signOut} />;
  else if (!hasAccess) gate = <Waiting name={myName} isAdmin={me.isAdmin} onRefresh={refreshMe} onSignOut={signOut} />;

  if (gate) {
    return (
      <AppContext.Provider value={ctx}>
        <div className="app">{gate}{previewButton}{previewSheet}</div>
      </AppContext.Provider>
    );
  }

  const todayDay = dayByNumber[today];

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        {tab === 'home' && !editMode && (
          <Home />
        )}

        {tab !== 'home' && <header className="topbar">
          <span className="wordmark" dir="ltr">JOURNEY</span>
          <span className="topbar-actions">
            {canEdit && !editMode && (
              <button className="icon-btn edit-toggle" onClick={() => { setEditMode(true); setTab((t) => (t === 'journey' || t === 'today' ? t : 'today')); }} aria-label="עריכת תוכן">
                <Icon.pencil />
              </button>
            )}
            <button onClick={() => setSheet({ type: 'space' })} aria-label="המרחב האישי שלי">
              <Avatar name={profile.name} photo={profile.photo} />
            </button>
          </span>
        </header>}

        {tab === 'today' && (
          <div className="screen" key={`today-${today}`}>
            <p className="greeting">{greeting(now, myName)}</p>
            {todayDay
              ? <DayPage day={todayDay} isToday {...dayProps} />
              : loadError ? <InlineError message={loadError} onRetry={() => setVersion((v) => v + 1)} /> : <p className="empty">טוענת את הבוקר שלך…</p>}
          </div>
        )}
        {tab === 'journey' && (
          <Journey days={days} today={today} completed={completed} activatedAt={profile.activatedAt} now={now}
            onOpen={(n) => (n === today ? setTab('today') : setOpenDay(n))} />
        )}
        {tab === 'community' && (
          <Community posts={posts} loading={feedState.loading} error={feedState.error} me={profile} now={Date.now()} today={today}
            onCompose={() => setSheet({ type: 'compose', day: null })} onLike={like} onComments={(post) => setSheet({ type: 'comments', post })}
            onDelete={removePost} onRetry={loadFeed} />
        )}
        {tab === 'library' && <Library items={library} loading={libLoading} onOpen={(item) => setSheet({ type: 'library', item })} />}

        {openDay && dayByNumber[openDay] && (
          <div className="overlay" role="dialog" aria-modal="true" aria-label={`יום ${openDay}`}>
            <div className="screen" key={openDay}>
              <button className="backbar" onClick={() => setOpenDay(null)}><Icon.back /> חזרה למסע</button>
              <div style={{ height: 10 }} />
              <DayPage day={dayByNumber[openDay]} {...dayProps} />
            </div>
          </div>
        )}

        <nav className="tabs" aria-label="ניווט ראשי">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id && !openDay ? 'page' : undefined} onClick={() => { setOpenDay(null); setTab(t.id); }}>
              {t.label}
            </button>
          ))}
        </nav>

        {sheet && sheet.type === 'compose' && <ComposeSheet day={sheet.day} onClose={() => setSheet(null)} onPublish={publish} />}
        {sheet && sheet.type === 'comments' && (
          <CommentsSheet post={sheet.post} now={Date.now()} onClose={() => setSheet(null)} onChanged={loadFeed} />
        )}
        {sheet && sheet.type === 'library' && <LibrarySheet item={sheet.item} onClose={() => setSheet(null)} />}
        {sheet && sheet.type === 'space' && (
          <SpaceSheet api={api} profile={profile} personal={personal} onClose={() => setSheet(null)}
            onSaved={() => { refreshMe(); loadFeed(); }} onSignOut={signOut} />
        )}
        {editMode && (
          <EditBar changed={changedCount} saving={saveState.saving} error={saveState.error} isPreview={!!api.isPreview}
            onSave={saveEdits} onDiscard={discardEdits} onExit={exitEdit} />
        )}
        {!editMode && previewButton}
        {previewSheet}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </AppContext.Provider>
  );
}

function ErrorScreen({ message, detail, onRetry }) {
  return (
    <main className="gate" style={{ alignContent: 'center' }}>
      <div className="sun" />
      <div className="gate-title">
        <p className="brand small-brand" dir="ltr">JOURNEY</p>
        <h1>רגע, משהו לא נטען</h1>
        <p>{message}</p>
      </div>
      <button className="btn white" style={{ justifySelf: 'center' }} onClick={onRetry}>לנסות שוב</button>
      {detail && <p className="note" dir="ltr" style={{ textAlign: 'center', wordBreak: 'break-word' }}>{detail}</p>}
    </main>
  );
}

function InlineError({ message, onRetry }) {
  return <div className="soft-error"><p>{message}</p><button className="link" onClick={onRetry}>לנסות שוב</button></div>;
}

// "המרחב האישי שלי": her private things from the journey, plus her profile.
function SpaceSheet({ api, profile, personal, onClose, onSaved, onSignOut }) {
  const [name, setName] = useState(profile.name);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const answered = purposeQuestions.map((q, i) => [q, personal.answers[i]]).filter(([, a]) => a && a.trim());
  const hasAny = personal.day1Video || personal.day9Video || answered.length || personal.ritual;
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.updateProfile({ name, photoFile: photo && photo.file }); onSaved(); onClose(); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Sheet title="המרחב האישי שלי" onClose={onClose}>
      <div className="stack" style={{ gap: 22 }}>
        <p className="lock-note">🔒 רק את רואה את מה שכאן.</p>

        {!hasAny && <p className="empty space-empty">כאן יישמרו הדברים האישיים שלך מהמסע: הסרטונים שלך, התשובות שלך והטקס שלך.</p>}

        {(personal.day1Video || personal.day9Video) && (
          <div className="space-videos">
            {personal.day1Video && <div className="space-video"><span className="eyebrow">יום 1</span><div className="media-frame"><video src={personal.day1Video.url} controls playsInline preload="metadata" /></div></div>}
            {personal.day9Video && <div className="space-video"><span className="eyebrow">יום 9</span><div className="media-frame"><video src={personal.day9Video.url} controls playsInline preload="metadata" /></div></div>}
          </div>
        )}

        {answered.length > 0 && (
          <div className="space-block">
            <p className="eyebrow">השאלות שפותחות מרחב · יום 8</p>
            {answered.map(([q, a], i) => <div key={i} className="qa"><strong>{q}</strong><p dir="auto">{a}</p></div>)}
          </div>
        )}

        {personal.ritual && <RitualCard ritual={personal.ritual} />}

        <hr className="rule" />

        <form className="stack" onSubmit={save}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={name || profile.name} photo={photo ? photo.url : profile.photo} size="lg" />
            <label className="add-photo" htmlFor="profile-photo" style={{ cursor: 'pointer' }}>החלפת תמונה</label>
            <input id="profile-photo" type="file" accept="image/*" className="sr"
              onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) setPhoto({ file: f, url: URL.createObjectURL(f) }); }} />
          </div>
          <div className="field">
            <label htmlFor="profile-name">השם שיופיע בקהילה</label>
            <input id="profile-name" className="input" dir="auto" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="profile-email">מייל</label>
            <input id="profile-email" className="input" value={profile.email || ''} dir="ltr" readOnly style={{ color: 'var(--ink-3)', textAlign: 'end' }} />
          </div>
          {error && <p className="error-note" role="alert">{error}</p>}
          <button className="btn primary block" type="submit" disabled={busy}>{busy ? 'שומרת…' : 'שמירה'}</button>
          <button className="btn quiet block" type="button" onClick={onSignOut}>התנתקות</button>
        </form>
      </div>
    </Sheet>
  );
}

function PreviewSheet({ api, onClose, onChanged }) {
  const p = api.preview;
  return (
    <Sheet title="תצוגה מקדימה" onClose={onClose}>
      <div className="stack" style={{ gap: 22 }}>
        <p className="note">הכפתור הזה קיים רק בגרסת התצוגה, כדי שתוכלי לראות כל מסך. הוא לא יופיע למשתתפות.</p>
        <div className="field">
          <label>איזה מסך להציג</label>
          <div className="seg">
            <button aria-pressed={p.stage === 'signin'} onClick={() => { p.setStage('signin'); onChanged(); }}>כניסה</button>
            <button aria-pressed={p.stage === 'waiting'} onClick={() => { p.setStage('waiting'); onChanged(); }}>ממתינה לאישור</button>
            <button aria-pressed={p.stage === 'app'} onClick={() => { p.setStage('app'); onChanged(); }}>בתוך המסע</button>
          </div>
        </div>
        <div className="field">
          <label>באיזה יום של המסע היא נמצאת</label>
          <div className="seg nine">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <button key={n} aria-pressed={p.stage === 'app' && p.day === n} onClick={() => { p.setDay(n); onChanged(); }}>{n}</button>
            ))}
          </div>
          <p className="note">טיפ: ביום 1 העלי סרטון קצר, ואז עברי ליום 9 כדי לראות את רגע המפגש איתו.</p>
        </div>
      </div>
    </Sheet>
  );
}
