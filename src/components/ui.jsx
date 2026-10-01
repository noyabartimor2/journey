// Small shared pieces: soft generated artwork, the few icons we use, helpers.
const { useState, useEffect, useRef } = React;

// Placeholder "photos": soft abstract light studies in the app palette.
const palettes = [
  ['#E2EAEF', '#F2E2DB', '#F8EFE6'],
  ['#E1E8DC', '#F3ECE2', '#FBF4EC'],
  ['#F2E2DB', '#E2EAEF', '#FAF4EE'],
  ['#DCE5E9', '#EBDDD4', '#F7EFE7'],
  ['#E8D9CF', '#DCE5D8', '#FAF5EF'],
  ['#F0E4DA', '#D9E3E8', '#FBF6F0'],
];
export function artStyle(seed = 1) {
  const p = palettes[seed % palettes.length];
  const x = 20 + ((seed * 37) % 60);
  const y = 18 + ((seed * 53) % 50);
  return {
    background: [
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,250,244,0.95) 0%, rgba(255,250,244,0) 32%)`,
      `radial-gradient(ellipse at ${100 - x}% ${100 - y / 2}%, ${p[0]} 0%, rgba(255,255,255,0) 60%)`,
      `linear-gradient(${140 + seed * 17}deg, ${p[1]} 0%, ${p[2]} 55%, ${p[0]} 100%)`,
    ].join(','),
  };
}

export function Art({ seed }) {
  return <div className="art" style={artStyle(seed)} aria-hidden="true" />;
}

export const Icon = {
  play: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 4.2v11.6L16 10z" fill="currentColor" /></svg>
  ),
  pause: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.2" height="12" rx="1.2" fill="currentColor" /><rect x="11.8" y="4" width="3.2" height="12" rx="1.2" fill="currentColor" /></svg>
  ),
  heart: ({ filled }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  ),
  check: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  ),
  // Points toward the start of the line (right in Hebrew) = "back".
  back: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  chevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  chevron: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

const avatarTones = ['', 'sage', 'mist', 'cream'];
export function Avatar({ name = '', photo, size }) {
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('');
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0)) % 997;
  const tone = avatarTones[h % avatarTones.length];
  return (
    <span className={`avatar ${tone} ${size || ''}`} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initials}
    </span>
  );
}

export function timeAgo(ts, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return 'עכשיו';
  if (m < 60) return m === 1 ? 'לפני דקה' : `לפני ${m} דקות`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : d === 2 ? 'לפני יומיים' : `לפני ${d} ימים`;
}

// Bottom sheet that slides up from the bottom of the screen.
export function Sheet({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current && ref.current.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגירה"><Icon.close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

