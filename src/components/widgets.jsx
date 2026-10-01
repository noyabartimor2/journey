// The interactive pieces inside the days: her private videos (Day 1 & 9),
// her answers (Day 8) and her morning ritual (Day 9). Saved to her private space,
// visible only to her.
import { Art } from './ui.jsx';
import { Rich } from './Rich.jsx';
import { purposeQuestions, ritualElements } from '../data/days.js';
import { useApp } from '../lib/context.js';
const { useState, useRef } = React;

function PlayableVideo({ url, portrait }) {
  const { isPreview } = useApp();
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <div className={portrait ? 'moment-video empty' : 'media-frame'}>
        <Art seed={9} />
        <div className="media-note">{isPreview ? 'הסרטון נשמר. התצוגה המקדימה לא יכולה להציג אותו כאן.' : 'הסרטון נשמר, אבל לא הצלחנו להציג אותו כרגע. נסי לרענן את הדף.'}</div>
      </div>
    );
  }
  return (
    <div className={portrait ? 'moment-video' : 'media-frame'}>
      <video src={url} controls playsInline preload="metadata" onError={() => setFailed(true)} />
    </div>
  );
}

// Upload / record a private video into her personal space.
export function PrivateVideo({ video, onSave, cta, savedText }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true); setError('');
    try { await onSave(f); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <div className="private">
      <input ref={ref} type="file" accept="video/*" className="sr" onChange={pick} tabIndex={-1} aria-hidden="true" />
      {video && !busy ? (
        <>
          <PlayableVideo url={video.url} />
          <div className="private-row">
            <span className="lock-note">🔒 {savedText}</span>
            <button className="link" onClick={() => ref.current.click()}>להחליף סרטון</button>
          </div>
        </>
      ) : (
        <>
          <button className="btn soft block" onClick={() => ref.current.click()} disabled={busy}>
            {busy ? 'מעלה את הסרטון… זה יכול לקחת דקה' : cta}
          </button>
          <p className="lock-note center">🔒 פרטי לגמרי. רק את רואה אותו. הוא לא עולה לקהילה.</p>
        </>
      )}
      {error && <p className="error-note" role="alert">{error}</p>}
    </div>
  );
}

export function PurposeAnswers({ answers, onSave }) {
  const [draft, setDraft] = useState(() => ({ ...answers }));
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setState('saving'); setError('');
    try { await onSave(draft); setState('saved'); } catch (err) { setError(err.message); setState('error'); }
  };
  return (
    <form className="answers" onSubmit={submit}>
      {purposeQuestions.map((q, i) => (
        <div className="field" key={i}>
          <label htmlFor={`purpose-${i}`} className="q">{q}</label>
          <textarea id={`purpose-${i}`} className="textarea small" rows={2} dir="auto" value={draft[i] || ''}
            onChange={(e) => { setState('idle'); setDraft({ ...draft, [i]: e.target.value }); }} />
        </div>
      ))}
      <button type="submit" className="btn primary block" disabled={state === 'saving'}>
        {state === 'saving' ? 'שומרת…' : state === 'saved' ? 'נשמר במרחב האישי שלך ✓' : 'לשמור את התשובות שלי'}
      </button>
      {error && <p className="error-note" role="alert">{error}</p>}
      <p className="lock-note center">🔒 התשובות פרטיות ונשמרות רק אצלך.</p>
    </form>
  );
}

export function RitualBuilder({ ritual, onSave }) {
  const [chosen, setChosen] = useState(() => (ritual ? ritual.items.map((x) => x.id) : []));
  const [notes, setNotes] = useState(() => Object.fromEntries((ritual ? ritual.items : []).map((x) => [x.id, x.note])));
  const [custom, setCustom] = useState('');
  const [customs, setCustoms] = useState(() => (ritual ? ritual.items.filter((x) => x.custom) : []));
  const [editing, setEditing] = useState(!ritual);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const all = [...ritualElements, ...customs.map((c) => ({ id: c.id, label: c.label, custom: true }))];
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    const id = `c${Date.now()}`;
    setCustoms([...customs, { id, label, custom: true }]);
    setChosen([...chosen, id]);
    setCustom('');
  };
  const save = async () => {
    const items = chosen.map((id) => {
      const el = all.find((e) => e.id === id);
      return { id, label: el.label, note: (notes[id] || '').trim(), custom: !!el.custom };
    });
    setBusy(true); setError('');
    try { await onSave({ items, at: Date.now() }); setEditing(false); } catch (err) { setError(err.message); }
    setBusy(false);
  };

  if (!editing && ritual) return <RitualCard ritual={ritual} onEdit={() => setEditing(true)} />;

  return (
    <div className="ritual">
      <div className="pick-chips" role="group" aria-label="האלמנטים של הטקס">
        {all.map((el) => (
          <button key={el.id} className="chip" aria-pressed={chosen.includes(el.id)} onClick={() => toggle(el.id)}>{el.label}</button>
        ))}
      </div>
      <div className="custom-row">
        <label className="sr" htmlFor="ritual-custom">אלמנט משלך</label>
        <input id="ritual-custom" className="input" placeholder="להוסיף משהו משלי…" value={custom}
          onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
        <button className="btn quiet" onClick={addCustom} disabled={!custom.trim()}>הוספה</button>
      </div>
      {chosen.length > 0 && (
        <div className="stack">
          <p className="eyebrow">ואיך זה נראה אצלך? (לא חובה)</p>
          {chosen.map((id) => {
            const el = all.find((e) => e.id === id);
            return (
              <div className="field" key={id}>
                <label htmlFor={`note-${id}`}>{el.label}</label>
                <input id={`note-${id}`} className="input" dir="auto" placeholder={el.hint || ''} value={notes[id] || ''}
                  onChange={(e) => setNotes({ ...notes, [id]: e.target.value })} />
              </div>
            );
          })}
        </div>
      )}
      <button className="btn primary block" onClick={save} disabled={chosen.length === 0 || busy}>{busy ? 'שומרת…' : 'ליצור את טקס הוודאות שלי'}</button>
      {error && <p className="error-note" role="alert">{error}</p>}
    </div>
  );
}

export function RitualCard({ ritual, onEdit }) {
  return (
    <div className="ritual-card">
      <p className="eyebrow">טקס הוודאות שלי</p>
      <h3>איך אני פוגשת את עצמי לפני שאני פוגשת את העולם</h3>
      <ol>
        {ritual.items.map((x) => (
          <li key={x.id}><strong>{x.label}</strong>{x.note && <span>{x.note}</span>}</li>
        ))}
      </ol>
      {onEdit && <button className="link" onClick={onEdit}>לשנות את הטקס</button>}
    </div>
  );
}

// DAY 9: the Day 1 → Day 9 moment. Three quiet steps:
// 1. a closed envelope ("יש משהו שהשארת לעצמך…"), 2. her Day 1 video, big and alone,
// 3. only then, the invitation to record the new one.
function Day1Reveal({ video }) {
  const { isPreview } = useApp();
  if (video) return <PlayableVideo url={video.url} portrait />;
  return (
    <div className="moment-video empty">
      <Art seed={1} />
      <div className="moment-empty-text">
        <strong>{isPreview ? 'כאן יופיע הסרטון שלך מיום 1' : 'הסרטון מיום 1 לא נשמר'}</strong>
        <span>{isPreview
          ? 'בתצוגה המקדימה: חזרי ליום 1, העלי סרטון קצר, וחזרי לכאן.'
          : 'זה בסדר גמור. היא עדיין שם, בזיכרון שלך. תני לעצמך רגע לזכור איך הרגשת לפני 8 ימים.'}</span>
      </div>
    </div>
  );
}

export function Day9Moment({ moment, day1Video, renderWidget, startAt }) {
  const [step, setStep] = useState(startAt || 'closed'); // 'closed' | 'open' | 'next'
  const nextRef = useRef(null);
  const goNext = () => {
    setStep('next');
    setTimeout(() => nextRef.current && nextRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  return (
    <section className={`moment step-${step}`} aria-label="המפגש עם הסרטון מיום 1">
      <div className="moment-glow" aria-hidden="true" />
      <p className="moment-eyebrow" dir="ltr">DAY 1 → DAY 9</p>
      <h2 className="moment-opening">{moment.opening}</h2>

      {step === 'closed' && (
        <div className="moment-closed">
          <div className="moment-guide"><Rich items={moment.before} /></div>
          <button className="btn primary block" onClick={() => setStep('open')}>{moment.reveal}</button>
        </div>
      )}

      {step !== 'closed' && (
        <div className="moment-open">
          <Day1Reveal video={day1Video} />
          {step === 'open' && (
            <>
              <p className="moment-hush">קחי את הזמן. אין לאן למהר.</p>
              <button className="btn white block" onClick={goNext}>{moment.watched}</button>
            </>
          )}
        </div>
      )}

      {step === 'next' && (
        <div className="moment-next" ref={nextRef}>
          <p className="eyebrow">{moment.next.label}</p>
          <h3>{moment.next.title}</h3>
          <Rich items={moment.next.body} renderWidget={renderWidget} />
        </div>
      )}
    </section>
  );
}
