import { KEY_LINE, TAGLINE } from '../data/days.js';
import { TOTAL_DAYS, unlockLabel } from '../lib/schedule.js';
import { Icon } from '../components/ui.jsx';

// Future days stay a mystery: no titles, no content, only a lock.
// Only the next day shows when it opens.
export function Journey({ days, today, completed, activatedAt, now, onOpen }) {
  const byNumber = Object.fromEntries(days.map((d) => [d.number, d]));
  const numbers = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  const doneCount = completed.size;
  return (
    <div className="screen">
      <header className="page-head">
        <p className="day-of plain" dir="ltr">JOURNEY</p>
        <h1>המסע שלך</h1>
        <p>{TAGLINE}</p>
      </header>

      <div className="progress-line">
        <div className="row"><span>יום {today} מתוך {TOTAL_DAYS}</span><span>{doneCount === 0 ? 'רק מתחילות' : doneCount === 1 ? 'בוקר אחד מאחורייך' : `${doneCount} בקרים מאחורייך`}</span></div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_DAYS} aria-valuenow={doneCount}><i style={{ width: `${(doneCount / TOTAL_DAYS) * 100}%` }} /></div>
      </div>

      <ol className="journey">
        {numbers.map((n) => {
          const d = byNumber[n] || { number: n, title: `יום ${n}`, emoji: '' };
          const locked = n > today || !byNumber[n];
          const isToday = d.number === today;
          const done = completed.has(d.number);
          const isNext = d.number === today + 1;
          const state = locked ? 'locked' : isToday ? 'today' : done ? 'done' : 'open';
          const status = locked
            ? (isNext ? `🔒 ${unlockLabel(d.number, activatedAt, now)}` : '🔒')
            : isToday ? (done ? '← היום · עשית את שלך ✓' : '← היום') : done ? '✓' : 'פתוח, מחכה לך';
          return (
            <li key={d.number}>
              <button className={`jrow ${state}`} disabled={locked} onClick={() => onOpen(d.number)}
                aria-label={locked ? `יום ${d.number}, נעול` : `יום ${d.number}: ${d.title}`}>
                <span className="num">{d.number}</span>
                <span className="txt">
                  {locked ? <span className="t">יום {d.number}</span> : <span className="t">{d.title} <span className="emoji">{d.emoji}</span></span>}
                  <span className="s">{status}</span>
                </span>
                {!locked && <span className="chev"><Icon.chevron /></span>}
              </button>
            </li>
          );
        })}
      </ol>

      {today < TOTAL_DAYS && (
        <p className="key-line">{KEY_LINE[0]}<br />{KEY_LINE[1]}</p>
      )}
    </div>
  );
}
