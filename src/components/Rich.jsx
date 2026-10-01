// Renders the day's text pieces (see data/days.js for the format).
import { AudioBlock } from './media.jsx';
import { useApp } from '../lib/context.js';
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

export function Rich({ items, renderWidget }) {
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
