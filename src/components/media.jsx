// Players for the daily content, the library and the community.
import { Art, Icon } from './ui.jsx';
import { useApp } from '../lib/context.js';
const { useState, useEffect, useRef } = React;

// Recognises any YouTube link (normal, short youtu.be, Shorts, embed, live) and returns the video id.
export function youtubeId(url = '') {
  try {
    const u = new URL(String(url).trim());
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, '');
    if (host === 'youtu.be') return u.pathname.split('/')[1] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const parts = u.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0]) && parts[1]) return parts[1];
    }
  } catch (e) { /* not a link */ }
  return null;
}

export function toEmbedUrl(url = '') {
  const id = youtubeId(url);
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '').endsWith('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const vid = parts.find((p) => /^\d+$/.test(p));
      const hash = parts[parts.indexOf(vid) + 1];
      if (vid) return `https://player.vimeo.com/video/${vid}${hash ? `?h=${hash}` : ''}`;
    }
  } catch (e) { /* not a link */ }
  return null;
}

export function VideoBlock({ title, duration, source, art }) {
  const [tapped, setTapped] = useState(false);
  let player = null;
  const embed = source && source.kind === 'link' ? toEmbedUrl(source.url) : null;
  if (embed) {
    player = <iframe src={embed} title={title || 'סרטון'} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  } else if (source && source.kind === 'upload' && source.url) {
    player = <video src={source.url} controls playsInline preload="metadata" />;
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="media-frame">
        {player || (
          <>
            <Art seed={art || 1} />
            <button className="play" onClick={() => setTapped(true)} aria-label={`הפעלת הסרטון ${title || ''}`}><Icon.play /></button>
            {tapped && <div className="media-note">הסרטון של היום יעלה לכאן בקרוב.</div>}
          </>
        )}
      </div>
      {duration && <div className="media-meta"><strong>{title}</strong><span>{duration}</span></div>}
    </div>
  );
}

function toSeconds(d = '0:00') {
  const [m, s] = String(d).split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// With `src` it plays the real recording. Without it (sample), the line moves on its own.
export function AudioBlock({ title, duration, src, loading }) {
  const { isPreview } = useApp();
  const audio = useRef(null);
  const [total, setTotal] = useState(toSeconds(duration));
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (src || !playing) return;
    const t = setInterval(() => setPos((p) => (p + 1 >= total ? 0 : p + 1)), 1000);
    return () => clearInterval(t);
  }, [playing, total, src]);
  const toggle = () => {
    if (!src) return setPlaying(!playing);
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  const seek = (e) => {
    if (!src || !audio.current || !total) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (r.right - e.clientX) / r.width)); // right-to-left
    audio.current.currentTime = ratio * total;
  };
  if (!src && !isPreview) {
    return (
      <div className="audio">
        <span className="round muted" aria-hidden="true"><Icon.play /></span>
        <strong>{title}</strong>
        <span className="time">{loading ? 'טוענת…' : 'ההקלטה תעלה לכאן בקרוב'}</span>
      </div>
    );
  }
  return (
    <div className="audio">
      {src && (
        <audio ref={audio} src={src} preload="metadata"
          onLoadedMetadata={(e) => isFinite(e.target.duration) && setTotal(e.target.duration)}
          onTimeUpdate={(e) => setPos(e.target.currentTime)}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPos(0); }} />
      )}
      <button className="round" onClick={toggle} aria-label={playing ? 'השהיה' : `האזנה ל${title}`}>
        {playing ? <Icon.pause /> : <Icon.play />}
      </button>
      <strong>{title}</strong>
      <div className="track">
        <div className="bar" onClick={seek}><i style={{ width: `${total ? (pos / total) * 100 : 0}%` }} /></div>
        <span className="time">{playing || pos ? fmt(pos) : (duration || (total ? fmt(total) : ''))}</span>
      </div>
    </div>
  );
}

export function ImageBlock({ caption, art, url }) {
  return (
    <figure className="figure">
      <div className="media-frame">{url ? <img src={url} alt={caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Art seed={art} />}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
