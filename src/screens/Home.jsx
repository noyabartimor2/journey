// Home: nothing but the word JOURNEY and one line, on a living aura.
// The light drifts on its own, leans toward the finger / cursor, and blooms where she taps.
const { useRef, useEffect, useState } = React;

export const HOME_LINE = 'מסע קהילתי של 9 ימים מחרדה לפריחה בחוסר בהירות';
const WORD = 'JOURNEY';

const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Soft, eased pointer-follow written into CSS variables (--mx/--my from 0 to 1).
function useAura(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let tx = 0.5, ty = 0.45, x = tx, y = ty, raf = 0, idle = 999;
    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      const r = el.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (p.clientX - r.left) / r.width));
      ty = Math.min(1, Math.max(0, (p.clientY - r.top) / r.height));
      idle = 0;
    };
    const tick = (t) => {
      idle += 1;
      // Left alone, the light slowly circles the word by itself.
      if (idle > 90) { tx = 0.5 + Math.sin(t / 2600) * 0.28; ty = 0.45 + Math.cos(t / 3400) * 0.18; }
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
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

// Floating specks of light, placed once.
const SPECKS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 2 + ((i * 7) % 5),
  delay: `${-((i * 1.7) % 14).toFixed(1)}s`,
  dur: `${12 + ((i * 5) % 10)}s`,
}));

export function Home() {
  const ref = useRef(null);
  const [blooms, setBlooms] = useState([]);
  useAura(ref);

  // A burst of light where she taps.
  const bloom = (e) => {
    if (reducedMotion()) return;
    const r = ref.current.getBoundingClientRect();
    const b = { id: Date.now() + Math.random(), x: e.clientX - r.left, y: e.clientY - r.top };
    setBlooms((bs) => [...bs.slice(-4), b]);
    setTimeout(() => setBlooms((bs) => bs.filter((x) => x.id !== b.id)), 1800);
  };

  return (
    <div className="home" ref={ref} onPointerDown={bloom}>
      <div className="aura" aria-hidden="true">
        <span className="halo" />
        <span className="orb o1" /><span className="orb o2" /><span className="orb o3" /><span className="orb o4" /><span className="orb o5" />
        <span className="core" />
        {SPECKS.map((s, i) => (
          <span key={i} className="speck" style={{ left: s.left, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }} />
        ))}
        {blooms.map((b) => <span key={b.id} className="bloom" style={{ left: b.x, top: b.y }} />)}
        <span className="aura-grain" />
      </div>

      <main className="home-hero">
        <h1 className="home-title" dir="ltr" aria-label={WORD}>
          {WORD.split('').map((ch, i) => <span key={i} aria-hidden="true" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>{ch}</span>)}
        </h1>
        <p className="home-line">{HOME_LINE}</p>
      </main>
    </div>
  );
}
