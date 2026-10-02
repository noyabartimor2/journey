// Renders the day's text pieces (see data/days.js for the format).
import { AudioBlock } from './media.jsx';
import { useApp } from '../lib/context.js';
import { Editable, PieceTools, typeOf } from './edit.jsx';
const { useState, useEffect } = React;

// An audio piece; if the admin uploaded a file for it, play the real recording.
function RichAudio({ title, duration, file_path }) {
  const { api } = useApp();
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    if (file_path && api) api.fileUrl('content', file_path).then((u) => alive && setSrc(u));
    return () => { alive = false; };
  }, [file_path]);
  return <AudioBlock title={title} duration={duration} src={src} loading={!!file_path && !src} />;
}

export function Inline({ text }) {
  const parts = String(text).split('**');
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

export function Rich({ items, renderWidget, onChange }) {
  if (onChange) return <RichEditor items={items || []} renderWidget={renderWidget} onChange={onChange} />;
  return (
    <div className="rich">
      {items.map((it, i) => {
        if (typeof it === 'string') return <p key={i} dir="auto"><Inline text={it} /></p>;
        if (it.b) return <p key={i} className="em" dir="auto"><Inline text={it.b} /></p>;
        if (it.h) return <h4 key={i} dir="auto">{it.h}</h4>;
        if (it.lines) return <div key={i} className="lines">{it.lines.map((l, j) => <p key={j} dir="auto"><Inline text={l} /></p>)}</div>;
        if (it.quotes) return <div key={i} className="quotes">{it.quotes.map((q, j) => <p key={j}>״{q}״</p>)}</div>;
        if (it.audio) return <div key={i} className="rich-media"><RichAudio {...it.audio} /></div>;
        if (it.widget) return <div key={i} className="rich-media">{renderWidget ? renderWidget(it.widget) : null}</div>;
        return null;
      })}
    </div>
  );
}

// The same pieces, typeable, with a small toolbar on each (type, move, add, delete).
function RichEditor({ items, renderWidget, onChange }) {
  const setAt = (i, v) => { const next = items.slice(); next[i] = v; onChange(next); };
  return (
    <div className="rich editing">
      {items.map((it, i) => {
        const t = typeOf(it);
        let body = null;
        if (t === 'p') body = <Editable as="p" editing value={it} onChange={(v) => setAt(i, v)} />;
        else if (t === 'b') body = <Editable as="p" className="em" editing value={it.b} onChange={(v) => setAt(i, { b: v })} />;
        else if (t === 'h') body = <Editable as="h4" editing value={it.h} onChange={(v) => setAt(i, { h: v })} />;
        else if (t === 'lines') body = <Editable as="div" className="lines multi" editing multiline value={it.lines} onChange={(v) => setAt(i, { lines: v })} placeholder="שורה בכל שורה…" />;
        else if (t === 'quotes') body = <Editable as="div" className="quotes multi" editing multiline value={it.quotes} onChange={(v) => setAt(i, { quotes: v })} placeholder="ציטוט בכל שורה…" />;
        else if (t === 'audio') body = (
          <div className="rich-media">
            <Editable as="p" className="piece-label" editing value={it.audio.title} onChange={(v) => setAt(i, { audio: { ...it.audio, title: v } })} placeholder="שם ההקלטה" />
          </div>
        );
        else if (t === 'widget') body = <div className="rich-media locked">{renderWidget ? renderWidget(it.widget) : null}</div>;
        return (
          <div key={i} className="piece">
            <PieceTools items={items} index={i} onChange={onChange} />
            {body}
          </div>
        );
      })}
      <button type="button" className="add-piece" onClick={() => onChange([...items, ''])}>＋ להוסיף פסקה</button>
    </div>
  );
}
