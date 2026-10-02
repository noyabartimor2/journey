// One JOURNEY day: the dawn with today's question, the video, and two (or three)
// soft cards that open: "המשימה שלך" and "המשחק של היום".
// Used both for Today and for opening an earlier day from the Journey.
import { KEY_LINE } from '../data/days.js';
import { TOTAL_DAYS } from '../lib/schedule.js';
import { Icon } from './ui.jsx';
import { VideoBlock } from './media.jsx';
import { Rich } from './Rich.jsx';
import { Editable } from './edit.jsx';
import { PrivateVideo, PurposeAnswers, RitualBuilder, Day9Moment } from './widgets.jsx';
const { useState } = React;

function Fold({ tone, label, title, children, defaultOpen, editing, onTitle }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (editing) return (
    <section className={`fold ${tone} open`}>
      <div className="fold-head">
        <span className="fold-titles">
          <span className="eyebrow">{label}</span>
          <Editable className="fold-title" editing value={title} onChange={onTitle} placeholder="כותרת" />
        </span>
      </div>
      <div className="fold-body"><div className="fold-inner">{children}</div></div>
    </section>
  );
  return (
    <section className={`fold ${tone} ${open ? 'open' : ''}`}>
      <button className="fold-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="fold-titles">
          <span className="eyebrow">{label}</span>
          <span className="fold-title" dir="auto">{title}</span>
        </span>
        <span className="fold-chev" aria-hidden="true"><Icon.chevronDown /></span>
      </button>
      <div className="fold-body"><div className="fold-inner">{children}</div></div>
    </section>
  );
}

export function DayPage({ day, isToday, today, completed, onComplete, onUndo, onShare, shareCount, personal, onSaveVideo, onSaveData, onGoCommunity, editing, onEdit }) {
  const number = day.number;
  // While editing: change one part of the day and hand the whole updated day up.
  const set = (key, value) => onEdit({ ...day, [key]: value });
  const setIn = (key, sub, value) => onEdit({ ...day, [key]: { ...day[key], [sub]: value } });
  const richEdit = (key, sub) => (editing ? (v) => (sub ? setIn(key, sub, v) : set(key, v)) : undefined);
  const done = completed.has(number);
  const shared = shareCount(number);

  const renderWidget = (name) => {
    if (name === 'day1Video') return (
      <PrivateVideo video={personal.day1Video} cta="לצלם או להעלות את הסרטון שלי" savedText="נשמר במרחב האישי שלך. נחזור אליו."
        onSave={(file) => onSaveVideo('day1_video', file)} />
    );
    if (name === 'day9Video') return (
      <PrivateVideo video={personal.day9Video} cta="לצלם או להעלות את הסרטון החדש" savedText="נשמר לצד הסרטון מיום 1, במרחב האישי שלך."
        onSave={(file) => onSaveVideo('day9_video', file)} />
    );
    if (name === 'purposeAnswers') return <PurposeAnswers answers={personal.answers} onSave={(a) => onSaveData('purpose_answers', { answers: a })} />;
    if (name === 'ritual') return <RitualBuilder ritual={personal.ritual} onSave={(r) => onSaveData('ritual', r)} />;
    return null;
  };

  return (
    <>
      <section className={`dawn ${isToday ? '' : 'compact'}`} style={{ '--rise': (number - 1) / (TOTAL_DAYS - 1) }}>
        <div className="sun" />
        <div className="horizon" />
        <div className="day-dots" aria-hidden="true">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => (
            <span key={i} className={completed.has(i + 1) ? 'done' : i + 1 === number ? 'now' : ''} />
          ))}
        </div>
        <p className="day-of" dir="ltr">DAY {number} OF {TOTAL_DAYS}</p>
        <h1>
          <Editable editing={editing} value={day.title} onChange={(v) => set('title', v)} placeholder="שם היום" />{' '}
          <Editable className="emoji" editing={editing} value={day.emoji} onChange={(v) => set('emoji', v)} placeholder="🙂" />
        </h1>
        <Editable as="p" className="question" editing={editing} value={day.question} onChange={(v) => set('question', v)} placeholder="השאלה של היום" />
      </section>

      <div className="intro">
        <Rich items={day.intro} onChange={richEdit('intro')} />
      </div>

      {day.moment && (
        <Day9Moment moment={day.moment} day1Video={personal.day1Video} renderWidget={renderWidget}
          startAt={personal.day9Video ? 'next' : 'closed'} />
      )}

      <section className="block">
        <p className="eyebrow">הסרטון של היום</p>
        <VideoBlock title={day.title} duration="" art={day.video.art} source={day.video.source} />
      </section>

      <div className="folds">
        {day.task && <Fold tone="sage" label="המשימה שלך" title={day.task.title} editing={editing} onTitle={(v) => setIn('task', 'title', v)}>
          <Rich items={day.task.body} renderWidget={renderWidget} onChange={richEdit('task', 'body')} />
          {day.share && editing && (
            <div className="share-task">
              <Editable as="p" className="btn primary block" editing value={day.share.cta} onChange={(v) => setIn('share', 'cta', v)} placeholder="טקסט הכפתור" />
            </div>
          )}
          {day.share && !editing && (
            <div className="share-task">
              {shared > 0 && <p className="shared-note">שיתפת {shared > 1 ? `${shared} פעמים` : ''} ✓ <button className="link" onClick={onGoCommunity}>לראות בקהילה</button></p>}
              {(!shared || day.share.repeatable) && (
                <button className="btn primary block" onClick={() => onShare(day)}>{shared && day.share.again ? day.share.again : day.share.cta}</button>
              )}
            </div>
          )}
        </Fold>}
        {day.extra && (
          <Fold tone="mist" label={day.extra.label} title={day.extra.title} editing={editing} onTitle={(v) => setIn('extra', 'title', v)}>
            <Rich items={day.extra.body} renderWidget={renderWidget} onChange={richEdit('extra', 'body')} />
          </Fold>
        )}
        <Fold tone="blush" label={day.game.label || 'המשחק של היום'} title={day.game.title} editing={editing} onTitle={(v) => setIn('game', 'title', v)}>
          <Rich items={day.game.body} onChange={richEdit('game', 'body')} />
        </Fold>
      </div>

      {!editing && <section className="finish">
        {!done ? (
          <button className="btn primary block" onClick={() => onComplete(number)}>עשיתי את שלי להיום ✓</button>
        ) : number === TOTAL_DAYS ? (
          <div className="done-card final">
            <div className="check"><Icon.check /></div>
            <p>לפני 9 ימים ביקשתי ממך לא לדעת מה מגיע מחר.<br />עכשיו את יודעת למה.</p>
            <h2>{KEY_LINE[0]}<br />{KEY_LINE[1]} ☀️</h2>
            <button className="link" onClick={() => onUndo(number)}>סימנתי בטעות</button>
          </div>
        ) : (
          <div className="done-card">
            <div className="check"><Icon.check /></div>
            <h2>זהו. באמת.</h2>
            <p>את לא צריכה לעשות עוד כדי ״להצליח״ באתגר.</p>
            <p>עכשיו לכי לחיות ותני למה שעשית הבוקר לעבוד בתוכך.</p>
            {isToday && number === today && <p className="next">מחר ב־08:00 מחכה לך הבוקר הבא.</p>}
            <button className="link" onClick={() => onUndo(number)}>סימנתי בטעות</button>
          </div>
        )}
      </section>}
    </>
  );
}
