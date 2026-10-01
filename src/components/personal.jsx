// Things that belong only to her: private videos (day 1 and day 9),
// her answers (day 8) and her morning ritual (day 9).
// PREVIEW: kept in memory. Later these are saved privately in the database/storage.
import { ritualOptions } from '../data/days.js';
import { Icon } from './ui.jsx';
const { useState, useRef } = React;

export function PrivateBadge({ children = 'רק את רואה את זה' }) {
  return <span className="private-badge">🔒 {children}</span>;
}

function VideoPlayback({ video }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="saved-video">
        <span className="check-dot"><Icon.check /></span>
        <span><strong>הסרטון נשמר</strong><br /><span className="note">{video.name}</span></span>
      </div>
    );
  }
  return (
    <div className="media-frame private-frame">
      <video src={video.url} controls playsInline preload="metadata" onError={() => setFailed(true)} />
    </div>
  );
}

// Upload a private video. Never posted to the community.
export function PrivateVideo({ slot, personal, setPersonal, cta = 'להעלות את הסרטון שלי', done = 'נשמר במרחב האישי שלך' }) {
  const video = personal.videos[slot];
  const ref = useRef(null);
  const pick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setPersonal((p) => ({ ...p, videos: { ...p.videos, [slot]: { url: URL.createObjectURL(f), name: f.name, at: Date.now() } } }));
    e.target.value = '';
  };
  return (
    <div className="private-box">
      <input ref={ref} id={`video-${slot}`} type="file" accept="video/*" className="sr" onChange={pick} />
      {!video ? (
        <>
          <button className="btn primary block" onClick={() => ref.current.click()}>{cta}</button>
          <PrivateBadge>הסרטון לא עולה לקהילה. רק את רואה אותו.</PrivateBadge>
        </>
      ) : (
        <>
          <VideoPlayback video={video} />
          <div className="row-between">
            <PrivateBadge>{done}</PrivateBadge>
            <button className="link" onClick={() => ref.current.click()}>להחליף</button>
          </div>
        </>
      )}
    </div>
  );
}

export function DayOneVideo({ personal }) {
  const video = personal.videos.day1;
  if (video) return <VideoPlayback video={video} />;
  return (
    <div className="media-frame placeholder-frame">
      <div className="placeholder-text">
        <strong>כאן יופיע הסרטון שצילמת ביום 1</strong>
        <span className="note">בתצוגה: אפשר לחזור ליום 1, להעלות סרטון, ואז לחזור לכאן.</span>
      </div>
    </div>
  );
}

// Day 8: answers saved privately as she types.
export function Answers({ questions, personal, setPersonal }) {
  const answers = personal.answers;
  const set = (i, v) => setPersonal((p) => ({ ...p, answers: { ...p.answers, [i]: v } }));
  return (
    <div className="answers">
      {questions.map((q, i) => (
        <div className="field" key={i}>
          <label htmlFor={`answer-${i}`} className="q">{q}</label>
          <textarea id={`answer-${i}`} className="textarea short" value={answers[i] || ''} onChange={(e) => set(i, e.target.value)} placeholder="בלי להיות הגיונית…" />
        </div>
      ))}
      <PrivateBadge>נשמר אוטומטית במרחב האישי שלך</PrivateBadge>
    </div>
  );
}

// Day 9: build "טקס הוודאות שלי".
export function RitualBuilder({ personal, setPersonal }) {
  const saved = personal.ritual;
  const [editing, setEditing] = useState(!saved);
  const [picked, setPicked] = useState(saved ? saved.items : []);
  const [custom, setCustom] = useState('');
  const [sentence, setSentence] = useState(saved ? saved.sentence : '');
  const toggle = (o) => setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  const addCustom = () => { const c = custom.trim(); if (c && !picked.includes(c)) setPicked((p) => [...p, c]); setCustom(''); };
  const save = () => { setPersonal((p) => ({ ...p, ritual: { items: picked, sentence: sentence.trim() } })); setEditing(false); };

  if (!editing && saved) return <RitualCard ritual={saved} onEdit={() => setEditing(true)} />;

  const options = [...ritualOptions, ...picked.filter((p) => !ritualOptions.includes(p))];
  return (
    <div className="ritual-builder">
      <p className="key-line small">בחרי את האלמנטים שלך</p>
      <div className="pick-chips" role="group" aria-label="אלמנטים לטקס">
        {options.map((o) => (
          <button key={o} className="pick" aria-pressed={picked.includes(o)} onClick={() => toggle(o)}>
            {picked.includes(o) && <span className="order">{picked.indexOf(o) + 1}</span>}{o}
          </button>
        ))}
      </div>
      <div className="inline-add">
        <label htmlFor="ritual-custom" className="sr">להוסיף משהו משלך</label>
        <input id="ritual-custom" className="input" placeholder="להוסיף משהו משלי…" value={custom}
          onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
        <button className="btn quiet" onClick={addCustom} disabled={!custom.trim()}>הוספה</button>
      </div>
      <div className="field">
        <label htmlFor="ritual-sentence">המשפט שמחזיר אותי לוודאות</label>
        <input id="ritual-sentence" className="input" placeholder="למשל: אני לא צריכה לדעת. אני צריכה להיות כאן." value={sentence} onChange={(e) => setSentence(e.target.value)} />
      </div>
      <button className="btn primary block" disabled={!picked.length} onClick={save}>ליצור את הטקס שלי</button>
    </div>
  );
}

export function RitualCard({ ritual, onEdit }) {
  return (
    <div className="ritual-card">
      <p className="eyebrow">5–10 דקות · כל בוקר</p>
      <h3>טקס הוודאות שלי</h3>
      <ol>{ritual.items.map((it, i) => <li key={i}>{it}</li>)}</ol>
      {ritual.sentence && <p className="ritual-sentence">״{ritual.sentence}״</p>}
      {onEdit && <button className="link" onClick={onEdit}>לשנות</button>}
    </div>
  );
}
