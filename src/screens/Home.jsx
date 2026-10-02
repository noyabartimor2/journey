// Home: the big JOURNEY name on a moving aura that leans toward her finger / cursor,
// and soft "magnetic" tiles that open every part of the app.
import { SUBTITLE } from '../data/days.js';
import { TOTAL_DAYS } from '../lib/schedule.js';
import { Avatar } from '../components/ui.jsx';
const { useRef, useEffect } = React;

const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The aura follows the pointer with a soft lag (eased every frame), and drifts on its own.
function useAura(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let tx = 0.5, ty = 0.35, x = tx, y = ty, raf = 0, idle = 0;
    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      const r = el.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (p.clientX - r.left) / r.width));
      ty = Math.min(1, Math.max(0, (p.clientY - r.top) / r.height));
      idle = 0;
    };
    const tick = (t) => {
      idle += 1;
      // When she isn't touching, the light wanders slowly by itself.
      if (idle > 120) { tx = 0.5 + Math.sin(t / 3200) * 0.22; ty = 0.36 + Math.cos(t / 4100) * 0.12; }
      x += (tx - x) * 0.045; y += (ty - y) * 0.045;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('touchmove', onMove); };
  }, []);
}

// A tile that is gently pulled toward the pointer while it's over it.
function Magnetic({ className, onClick, children, label, strength = 10 }) {
  const ref = useRef(null);
  const move = (e) => {
    if (reducedMotion() || e.pointerType === 'touch') return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    ref.current.style.setProperty('--tx', `${(dx * strength).toFixed(1)}px`);
    ref.current.style.setProperty('--ty', `${(dy * strength).toFixed(1)}px`);
    ref.current.style.setProperty('--gx', `${((dx + 1) * 50).toFixed(0)}%`);
    ref.current.style.setProperty('--gy', `${((dy + 1) * 50).toFixed(0)}%`);
  };
  const leave = () => { ['--tx', '--ty'].forEach((v) => ref.current.style.setProperty(v, '0px')); };
  return (
    <button ref={ref} className={`mag ${className || ''}`} onClick={onClick} onPointerMove={move} onPointerLeave={leave} aria-label={label}>
      <span className="mag-glow" aria-hidden="true" />
      {children}
    </button>
  );
}

export function Home({ name, greeting, today, todayDay, doneCount, profile, onGo, onSpace }) {
  const ref = useRef(null);
  useAura(ref);
  return (
    <div className="home" ref={ref}>
      <div className="aura" aria-hidden="true">
        <span className="orb o1" /><span className="orb o2" /><span className="orb o3" /><span className="orb o4" />
        <span className="aura-grain" />
      </div>

      <header className="home-top">
        <span className="home-greeting">{greeting}</span>
        <button onClick={onSpace} aria-label="המרחב האישי שלי"><Avatar name={profile.name} photo={profile.photo} /></button>
      </header>

      <section className="home-hero">
        <h1 className="home-title" dir="ltr">JOURNEY</h1>
        <p className="home-sub">{SUBTITLE}</p>
        <div className="home-progress" aria-label={`יום ${today} מתוך ${TOTAL_DAYS}`}>
          {Array.from({ length: TOTAL_DAYS }, (_, i) => (
            <span key={i} className={i + 1 < today ? 'past' : i + 1 === today ? 'now' : ''} />
          ))}
        </div>
      </section>

      <nav className="home-tiles" aria-label="לאן נכנסים">
        <Magnetic className="tile today" onClick={() => onGo('today')} label="הבוקר של היום" strength={8}>
          <span className="tile-eyebrow">הבוקר של היום · יום {today}</span>
          <span className="tile-title">{todayDay ? <>{todayDay.title} <span aria-hidden="true">{todayDay.emoji}</span></> : 'הבוקר שלך'}</span>
          {todayDay && <span className="tile-text">{todayDay.question}</span>}
          <span className="tile-cta">להיכנס ←</span>
        </Magnetic>
        <Magnetic className="tile journey" onClick={() => onGo('journey')} label="המסע">
          <span className="tile-icon" aria-hidden="true">🧭</span>
          <span className="tile-title">המסע</span>
          <span className="tile-text">{doneCount} מתוך {TOTAL_DAYS} בקרים</span>
        </Magnetic>
        <Magnetic className="tile community" onClick={() => onGo('community')} label="קהילה">
          <span className="tile-icon" aria-hidden="true">💬</span>
          <span className="tile-title">קהילה</span>
          <span className="tile-text">שיתופים ופרגונים</span>
        </Magnetic>
        <Magnetic className="tile library" onClick={() => onGo('library')} label="ספרייה">
          <span className="tile-icon" aria-hidden="true">🎧</span>
          <span className="tile-title">ספרייה</span>
          <span className="tile-text">הקלטות וכלים</span>
        </Magnetic>
        <Magnetic className="tile space" onClick={onSpace} label="המרחב האישי">
          <span className="tile-icon" aria-hidden="true">🔒</span>
          <span className="tile-title">המרחב שלי</span>
          <span className="tile-text">רק את רואה</span>
        </Magnetic>
      </nav>
    </div>
  );
}
