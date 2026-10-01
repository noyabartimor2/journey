import { libraryCategories, kindLabels } from '../data/library.js';
import { Sheet } from '../components/ui.jsx';
import { VideoBlock, AudioBlock } from '../components/media.jsx';
import { Inline } from '../components/Rich.jsx';
import { useApp } from '../lib/context.js';
const { useState, useEffect } = React;

export function Library({ items, loading, onOpen }) {
  const [cat, setCat] = useState('all');
  const shown = cat === 'all' ? items : items.filter((i) => i.category === cat);
  const cats = libraryCategories.filter((c) => c.id === 'all' || items.some((i) => i.category === c.id));
  return (
    <div className="screen">
      <header className="page-head">
        <h1>הספרייה</h1>
        <p>הכלים מהמסע, תמיד כאן. גם אחרי היום התשיעי.</p>
      </header>
      {cats.length > 2 && (
        <div className="chips" role="group" aria-label="סינון לפי סוג">
          {cats.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
        </div>
      )}
      {loading && !items.length && <p className="empty">טוענת…</p>}
      {!loading && !items.length && <p className="empty">הספרייה מתמלאת. בקרוב יופיעו כאן הקלטות וכלים.</p>}
      <div className="lib">
        {shown.map((it) => (
          <button className="lib-item" key={it.id} onClick={() => onOpen(it)}>
            <span className={`swatch sw-${it.kind}`} aria-hidden="true" />
            <span className="txt">
              <span className="eyebrow">{kindLabels[it.kind]}{it.meta ? ` · ${it.meta}` : ''}</span>
              <strong>{it.title}</strong>
              <p>{it.description}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LibrarySheet({ item: it, onClose }) {
  const { api, isPreview } = useApp();
  const [url, setUrl] = useState(null);
  const [loaded, setLoaded] = useState(!it.filePath);
  useEffect(() => {
    if (!it.filePath) return;
    api.fileUrl('content', it.filePath).then((u) => { setUrl(u); setLoaded(true); });
  }, [it.id]);
  const soon = <p className="note" style={{ textAlign: 'center' }}>{isPreview ? 'קובץ לדוגמה. באפליקציה האמיתית הוא ייפתח כאן.' : 'הקובץ יעלה לכאן בקרוב.'}</p>;
  return (
    <Sheet title={it.title} onClose={onClose}>
      <div className="stack" style={{ gap: 18 }}>
        <p style={{ color: 'var(--ink-2)' }}>{it.description}</p>
        {it.kind === 'audio' && <AudioBlock title={it.title} duration={url ? '' : (/^\d+/.test(it.meta) ? `${parseInt(it.meta, 10)}:00` : '')} src={url} loading={!loaded} />}
        {it.kind === 'video' && <VideoBlock title={it.title} art={it.art || 4} source={it.youtubeUrl ? { kind: 'link', url: it.youtubeUrl } : null} />}
        {it.kind === 'text' && it.body && <div className="prose">{it.body.map((p, i) => <p key={i}><Inline text={p} /></p>)}</div>}
        {it.kind === 'pdf' && (
          <>
            <div className="file-card">
              <span className="doc">PDF</span>
              <span className="txt"><strong>{it.title}</strong><span>{it.meta}</span></span>
            </div>
            {url
              ? <a className="btn primary block" href={url} target="_blank" rel="noopener">פתיחת הקובץ</a>
              : loaded && soon}
          </>
        )}
      </div>
    </Sheet>
  );
}
