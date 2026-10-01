import { Avatar, Icon, Sheet, Art, timeAgo } from '../components/ui.jsx';
import { useApp } from '../lib/context.js';
import { MAX_VIDEO_SECONDS, MAX_UPLOAD_MB } from '../config.js';
const { useState, useRef, useEffect } = React;

// Reads a picked video's length (and size) in the browser before uploading.
function readVideoInfo(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const url = URL.createObjectURL(file);
    const done = (info) => { URL.revokeObjectURL(url); resolve(info); };
    v.onloadedmetadata = () => done({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => done({ duration: null });
    setTimeout(() => done({ duration: null }), 8000);
    v.src = url;
  });
}

function PostMedia({ media }) {
  if (!media || !media.length) return null;
  return media.map((m, i) => {
    if (m.type === 'video') {
      return (
        <div className="photo video" key={i}>
          {m.url ? <video src={m.url} controls playsInline preload="metadata" /> : <Art seed={i + 3} />}
        </div>
      );
    }
    return <div className="photo" key={i}>{m.url ? <img src={m.url} alt="" loading="lazy" /> : <Art seed={m.art} />}</div>;
  });
}

function postLabel(post, today) {
  if (!post.day || post.day > today) return null;
  return post.label ? `${post.label} · יום ${post.day}` : `יום ${post.day}`;
}

function PostCard({ post, now, today, onLike, onComments, onDelete }) {
  const c = post.commentCount || 0;
  const label = postLabel(post, today);
  const [confirm, setConfirm] = useState(false);
  return (
    <article className="post">
      <div className="post-head">
        <Avatar name={post.author.name} photo={post.author.photo} />
        <div className="who">
          <strong>{post.author.name}</strong>
          <span>{timeAgo(post.createdAt, now)}</span>
        </div>
        {label && <span className="tag">{label}</span>}
      </div>
      {post.text && <p className="text" dir="auto">{post.text}</p>}
      <PostMedia media={post.media} />
      <div className="post-actions">
        <button className={post.likedByMe ? 'liked' : ''} onClick={() => onLike(post)} aria-pressed={post.likedByMe}>
          <Icon.heart filled={post.likedByMe} /> {post.likes > 0 ? post.likes : ''} <span className="sr">אהבתי</span>
        </button>
        <button onClick={() => onComments(post)}>
          {c === 0 ? 'לפרגן' : c === 1 ? 'תגובה אחת' : `${c} תגובות`}
        </button>
        {post.mine && (
          confirm
            ? <span className="confirm-row"><button className="danger" onClick={() => onDelete(post)}>למחוק?</button><button onClick={() => setConfirm(false)}>ביטול</button></span>
            : <button className="push-end" onClick={() => setConfirm(true)}>מחיקה</button>
        )}
      </div>
    </article>
  );
}

export function Community({ posts, loading, error, me, now, today, onCompose, onLike, onComments, onDelete, onRetry }) {
  return (
    <div className="screen">
      <header className="page-head">
        <h1>הקהילה</h1>
        <p>נשים בתוך אותו מסע. השראה, הוכחות, וביחד.</p>
      </header>
      <button className="composer" onClick={() => onCompose(null)}>
        <Avatar name={me.name} photo={me.photo} />
        <span>מה קורה אצלך היום?</span>
      </button>
      {error && <div className="soft-error"><p>{error}</p><button className="link" onClick={onRetry}>לנסות שוב</button></div>}
      {loading && !posts.length && <p className="empty">טוענת…</p>}
      {!loading && !error && !posts.length && <p className="empty">עוד אין כאן שיתופים. אולי את הראשונה? 🤍</p>}
      <div className="feed">
        {posts.map((p) => <PostCard key={p.id} post={p} now={now} today={today} onLike={onLike} onComments={onComments} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

// Opens either as a general post, or as a day's sharing task (Day 2, 5, 6, 7)
// with its own title, label and starting line. Photos and videos (up to 3 minutes).
export function ComposeSheet({ day, onClose, onPublish }) {
  const share = day ? day.share : null;
  const [text, setText] = useState('');
  const [items, setItems] = useState([]); // { file, kind, preview, duration, width, height }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setError('');
    for (const file of files) {
      const kind = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : null;
      if (!kind) { setError('אפשר להוסיף רק תמונה או סרטון.'); continue; }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(kind === 'video'
          ? `הסרטון גדול מדי (מעל ${MAX_UPLOAD_MB}MB). נסי סרטון קצר יותר או באיכות רגילה.`
          : `התמונה גדולה מדי (מעל ${MAX_UPLOAD_MB}MB).`);
        continue;
      }
      let info = {};
      if (kind === 'video') {
        info = await readVideoInfo(file);
        if (info.duration && info.duration > MAX_VIDEO_SECONDS + 2) {
          setError('הסרטון ארוך מ־3 דקות. אפשר לקצר אותו בטלפון ולנסות שוב.');
          continue;
        }
        if (!info.duration) info.duration = null;
      }
      setItems((list) => [...list, { file, kind, preview: URL.createObjectURL(file), ...info }].slice(0, 4));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await onPublish({
        text: text.trim(), day: day ? day.number : null, label: share ? share.label : null,
        files: items.map((it) => ({ file: it.file, kind: it.kind, duration: it.kind === 'video' ? Math.round(it.duration || MAX_VIDEO_SECONDS) : null, width: it.width, height: it.height })),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const hasVideo = items.some((it) => it.kind === 'video');

  return (
    <Sheet title={share ? share.cta : 'שיתוף בקהילה'} onClose={busy ? () => {} : onClose}>
      <form className="stack" onSubmit={submit}>
        {share && <span className="tag" style={{ justifySelf: 'start' }}>{share.label} · יום {day.number}</span>}
        <label className="sr" htmlFor="post-text">הטקסט של הפוסט</label>
        <textarea id="post-text" className="textarea" dir="auto" placeholder={share ? share.placeholder : 'מה קורה אצלך היום?'} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        {items.map((it, i) => (
          <div className="thumb" key={i}>
            {it.kind === 'video' ? <video src={it.preview} muted playsInline preload="metadata" /> : <img src={it.preview} alt="" />}
            {it.kind === 'video' && it.duration ? <span className="thumb-badge">{Math.floor(it.duration / 60)}:{String(Math.round(it.duration % 60)).padStart(2, '0')}</span> : null}
            {!busy && <button type="button" className="icon-btn" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="הסרה"><Icon.close /></button>}
          </div>
        ))}
        {error && <p className="error-note" role="alert">{error}</p>}
        <div className="row-between">
          <input ref={fileRef} id="post-media" type="file" accept="image/*,video/*" multiple className="sr" onChange={pick} tabIndex={-1} aria-hidden="true" />
          <button type="button" className="add-photo" onClick={() => fileRef.current.click()} disabled={busy || items.length >= 4}>תמונה או סרטון</button>
          <button type="submit" className="btn primary" disabled={busy || (!text.trim() && !items.length)}>
            {busy ? (hasVideo ? 'מעלה סרטון…' : 'משתפת…') : 'לשתף'}
          </button>
        </div>
        <p className="note">סרטון עד 3 דקות.</p>
      </form>
    </Sheet>
  );
}

export function CommentsSheet({ post, now, onClose, onChanged }) {
  const { api } = useApp();
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => api.loadComments(post.id).then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [post.id]);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError('');
    try { await api.addComment(post.id, text.trim()); setText(''); await load(); onChanged(); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  const remove = async (id) => {
    try { await api.deleteComment(id); await load(); onChanged(); } catch (err) { setError(err.message); }
  };
  return (
    <Sheet title="תגובות" onClose={onClose}>
      <div className="comments">
        {list === null && !error && <p className="empty">טוענת…</p>}
        {list && list.length === 0 && <p className="empty">עוד אין תגובות. אפשר להיות הראשונה לפרגן.</p>}
        {(list || []).map((c) => (
          <div className="comment" key={c.id}>
            <Avatar name={c.author.name} photo={c.author.photo} />
            <div className="bubble">
              <strong>{c.author.name}</strong>
              <p dir="auto">{c.text}</p>
              <span>{timeAgo(c.createdAt, now)}{c.mine && <> · <button className="inline-link" onClick={() => remove(c.id)}>מחיקה</button></>}</span>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="error-note" role="alert">{error}</p>}
      <form className="comment-form" onSubmit={send}>
        <label className="sr" htmlFor="comment-text">תגובה</label>
        <input id="comment-text" className="input" dir="auto" placeholder="מה את רואה בה?" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn primary" disabled={busy || !text.trim()} style={{ minHeight: 48, padding: '0 18px' }}>שליחה</button>
      </form>
    </Sheet>
  );
}
