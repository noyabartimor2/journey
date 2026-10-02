// The sales page (site/join/). Texts come from data/sales.js, or the admin's edited version (site_texts).
// Admins (signed in to JOURNEY) see an edit button and can change every text in place.
// The join button goes to JOIN_URL; until payment is connected it shows "opening soon".
// After a successful payment Grow returns her to /join/thanks/ (ThanksPage), which leads into the app's home.
import { days } from '../data/days.js';
import { salesDefaults } from '../data/sales.js';
import { AuraStage, JourneyWord } from '../components/Aura.jsx';
import { Editable, EditBar, useUnsavedWarning } from '../components/edit.jsx';
import { Icon } from '../components/ui.jsx';
import { siteApi } from '../lib/site-api.js';
import { JOIN_URL } from '../config.js';
import { EmailSender } from '../components/EmailSender.jsx';

const { useState, useEffect } = React;

const KEY = 'sales';
const clone = (o) => JSON.parse(JSON.stringify(o));
const getIn = (o, path) => path.reduce((x, k) => (x == null ? x : x[k]), o);
function setIn(o, path, v) {
  const c = clone(o); let x = c;
  path.slice(0, -1).forEach((k) => { x = x[k]; });
  x[path[path.length - 1]] = v;
  return c;
}

// The page's texts: saved version from the database merged over the defaults.
function useSalesTexts() {
  const [texts, setTexts] = useState(null);
  useEffect(() => {
    let done = false;
    const finish = (saved) => { if (!done) { done = true; setTexts({ ...salesDefaults, ...(saved || {}) }); } };
    siteApi.load(KEY).then(finish).catch(() => finish(null));
    const t = setTimeout(() => finish(null), 2500);   // never leave the page blank
    return () => clearTimeout(t);
  }, []);
  return [texts, setTexts];
}

export function SalesPage() {
  const [saved, setSaved] = useSalesTexts();
  const [draft, setDraft] = useState(null);           // edited texts, while editing
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState({ saving: false, error: '' });
  useUnsavedWarning(!!draft);
  useEffect(() => { siteApi.canEdit().then(setCanEdit).catch(() => {}); }, []);

  if (!saved) return <div className="app sales"><AuraStage className="sales-hero" /></div>;
  const c = draft || saved;
  const set = (path, v) => setDraft(setIn(c, path, v));
  // A text that becomes typeable in edit mode.
  const E = (path, props = {}) => <Editable editing={editing} value={getIn(c, path)} onChange={(v) => set(path, v)} {...props} />;
  const listTools = (path, index, blank) => editing && (
    <span className="list-tools" contentEditable={false}>
      <button type="button" aria-label="להוסיף מתחת" onClick={() => { const a = getIn(c, path).slice(); a.splice(index + 1, 0, clone(blank)); set(path, a); }}>＋</button>
      <button type="button" aria-label="למחוק" onClick={() => set(path, getIn(c, path).filter((_, i) => i !== index))}>🗑</button>
    </span>
  );

  const save = async () => {
    setState({ saving: true, error: '' });
    try { await siteApi.save(KEY, c); setSaved(c); setDraft(null); setState({ saving: false, error: '' }); }
    catch (e) { setState({ saving: false, error: e.message }); }
  };

  const price = (
    <div className="sales-price" aria-label={`במקום ${c.priceFull} שקלים, עכשיו ${c.priceNow} שקלים`}>
      <span className="was">₪{E(['priceFull'])}</span>
      <span className="now">₪{E(['priceNow'])}</span>
      {E(['priceNote'], { className: 'note' })}
    </div>
  );
  const join = (
    <div className="sales-join">
      {editing
        ? <div className="btn primary block">{E([JOIN_URL ? 'joinLabel' : 'soonLabel'])}</div>
        : JOIN_URL
          ? <a className="btn primary block" href={JOIN_URL}>{c.joinLabel}</a>
          : <button className="btn primary block" disabled>{c.soonLabel}</button>}
    </div>
  );

  return (
    <div className={`app sales ${editing ? 'is-editing' : ''}`}>
      <AuraStage className="sales-hero">
        <div className="sales-hero-inner">
          <JourneyWord />
          {E(['heroLine'], { as: 'p', className: 'home-line' })}
          <div className="sales-hero-offer">
            {price}
            {join}
            {editing ? E(['signinLabel'], { as: 'p', className: 'link sales-signin' }) : <a className="link sales-signin" href="../">{c.signinLabel}</a>}
          </div>
        </div>
        <a className="sales-scroll" href="#more" aria-label="לגלול לפרטים"><span aria-hidden="true">⌄</span></a>
      </AuraStage>

      <main className="sales-body" id="more">
        <p className="key-line sales-key">{E(['keyLine', 0])}<br />{E(['keyLine', 1])}</p>

        <section className="sales-section prose">
          {E(['introLead'], { as: 'p' })}
          {c.intro.map((t, i) => <div key={i} className="list-row">{E(['intro', i], { as: 'p' })}{listTools(['intro'], i, '')}</div>)}
        </section>

        <section className="sales-section">
          {E(['forYouEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['forYouTitle'], { as: 'h2' })}
          <ul className="sales-list">
            {c.forYou.map((t, i) => <li key={i}>{E(['forYou', i])}{listTools(['forYou'], i, '')}</li>)}
          </ul>
        </section>

        <section className="sales-section">
          {E(['outcomesEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['outcomesTitle'], { as: 'h2' })}
          <ul className="sales-outcomes">
            {c.outcomes.map((o, i) => (
              <li key={i}>
                {E(['outcomes', i, 'emoji'], { className: 'emoji' })}
                <div>
                  {E(['outcomes', i, 'title'], { as: 'p', className: 'title' })}
                  {E(['outcomes', i, 'text'], { as: 'p' })}
                  {listTools(['outcomes'], i, { emoji: '✨', title: '', text: '' })}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="sales-section">
          {E(['daysEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['daysTitle'], { as: 'h2' })}
          <ol className="sales-days">
            {days.map((d) => (
              <li key={d.number}>
                <span className="num">{d.number}</span>
                <div>
                  <p className="day-label">יום {d.number}</p>
                  <p className="title">{d.title} <span aria-hidden="true">{d.emoji}</span></p>
                  <p className="q">{d.question}</p>
                </div>
              </li>
            ))}
          </ol>
          {editing && <p className="note sales-center">שמות הימים והשאלות מגיעים מתוכן הימים, ונערכים בתוך האפליקציה.</p>}
          {E(['daysNote'], { as: 'p', className: 'note sales-center' })}
        </section>

        <section className="sales-section">
          {E(['insideEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['insideTitle'], { as: 'h2' })}
          <div className="sales-grid">
            {c.inside.map((it, i) => (
              <div className="sales-card" key={i}>
                {E(['inside', i, 'emoji'], { className: 'emoji' })}
                {E(['inside', i, 'title'], { as: 'p', className: 'title' })}
                {E(['inside', i, 'text'], { as: 'p' })}
                {listTools(['inside'], i, { emoji: '✨', title: '', text: '' })}
              </div>
            ))}
          </div>
        </section>

        <section className="sales-section">
          {E(['stepsEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['stepsTitle'], { as: 'h2' })}
          <ol className="sales-steps">
            {c.steps.map((st, i) => (
              <li key={i}>
                {E(['steps', i, 'title'], { as: 'p', className: 'title' })}
                {E(['steps', i, 'text'], { as: 'p' })}
                {listTools(['steps'], i, { title: '', text: '' })}
              </li>
            ))}
          </ol>
        </section>

        <AuraStage className="sales-offer">
          {E(['offerTitle'], { as: 'h2' })}
          {E(['offerLine'], { as: 'p', className: 'tagline' })}
          {price}
          {join}
        </AuraStage>

        <section className="sales-section">
          {E(['faqEyebrow'], { as: 'p', className: 'eyebrow' })}
          {E(['faqTitle'], { as: 'h2' })}
          <div className="sales-faq">
            {c.faq.map((f, i) => (editing ? (
              <div className="faq-edit" key={i}>
                {E(['faq', i, 'q'], { as: 'p', className: 'q', placeholder: 'שאלה' })}
                {E(['faq', i, 'a'], { as: 'p', placeholder: 'תשובה' })}
                {listTools(['faq'], i, { q: '', a: '' })}
              </div>
            ) : (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            )))}
          </div>
        </section>

        <footer className="sales-footer">
          <p className="brand small-brand" dir="ltr">JOURNEY</p>
          <a className="link" href="../">{c.signinLabel}</a>
        </footer>
      </main>

      {canEdit && !editing && (
        <button className="sales-edit-btn" onClick={() => setEditing(true)} aria-label="עריכת דף הנחיתה"><Icon.pencil /> עריכה</button>
      )}
      {editing && (
        <EditBar changed={draft ? 1 : 0} saving={state.saving} error={state.error} isPreview={siteApi.preview}
          changedLabel="יש שינויים שלא נשמרו"
          onSave={save} onDiscard={() => { setDraft(null); setState({ saving: false, error: '' }); }}
          onExit={() => { setEditing(false); setDraft(null); }} />
      )}
    </div>
  );
}

// Where Grow sends her after paying. It does NOT grant access by itself: access is opened
// on the server once Grow confirms the payment, and she gets a sign-in link by email.
export function ThanksPage() {
  return (
    <div className="app sales">
      <AuraStage className="home thanks">
        <main className="home-hero">
          <JourneyWord />
          <p className="home-line">ברוכה הבאה למסע 🤍</p>
          <div className="thanks-card">
            <h2>התשלום התקבל</h2>
            <p>ברגע שהאישור מגיע אלינו, נשלח אלייך מייל עם קישור כניסה אישי. לחיצה עליו תכניס אותך ישר ל־JOURNEY, ויום 1 כבר יחכה לך.</p>
            <EmailSender />
            <p className="note">לא הגיע תוך כמה דקות? כדאי להציץ בספאם או בקידומי מכירות. אפשר גם להיכנס עם המייל שאיתו שילמת.</p>
            <a className="btn primary block" href="../../">להיכנס ל־JOURNEY</a>
            <p className="thanks-help">
              יש לך שאלה? תפני אליי באינסטגרם, אשמח לסייע!{' '}
              <a href="https://instagram.com/noya_bt" target="_blank" rel="noopener" dir="ltr">@noya_bt</a>
            </p>
          </div>
        </main>
      </AuraStage>
    </div>
  );
}
