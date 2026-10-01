// The screens before she's inside: sign-in, waiting for approval, and a closed account.
import { KEY_LINE, SUBTITLE, TAGLINE } from '../data/days.js';
import { useApp } from '../lib/context.js';
const { useState, useEffect } = React;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function SignIn() {
  const { api, isPreview } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendLink = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true); setError('');
    try { await api.signInEmail(email); setSent(true); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  const google = async () => {
    setError('');
    try { await api.signInGoogle(); } catch (err) { setError(err.message); }
  };

  return (
    <main className="gate">
      <div className="sun" />
      <div className="gate-title">
        <p className="brand" dir="ltr">JOURNEY</p>
        <h1>{SUBTITLE}</h1>
        <p>{TAGLINE}</p>
      </div>
      {!sent ? (
        <form className="gate-form" onSubmit={sendLink}>
          {api.googleEnabled && (
            <>
              <button type="button" className="btn white block" onClick={google}><GoogleMark /> המשך עם Google</button>
              <div className="divider">או עם כתובת מייל</div>
            </>
          )}
          <label className="sr" htmlFor="signin-email">כתובת מייל</label>
          <input id="signin-email" className="input" type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder="name@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} style={{ textAlign: 'center' }} />
          <button type="submit" className="btn primary block" disabled={!valid || busy}>{busy ? 'שולחת…' : 'שליחת קישור כניסה'}</button>
          {error && <p className="error-note center" role="alert">{error}</p>}
          <p className="small">נשלח אלייך קישור למייל. בלי סיסמאות לזכור.</p>
        </form>
      ) : (
        <div className="sent">
          <h2 style={{ fontSize: 'var(--step-3)' }}>בדקי את תיבת המייל</h2>
          <p style={{ color: 'var(--ink-2)' }}>שלחנו קישור כניסה אל <bdi dir="ltr">{email.trim()}</bdi>. לחיצה עליו תכניס אותך ישר פנימה.</p>
          <p className="note">לא הגיע תוך כמה דקות? כדאי להציץ גם בתיקיית הספאם או קידומי מכירות.</p>
          {isPreview && <button className="btn primary block" onClick={() => api.signInGoogle()}>המשך בתצוגה</button>}
          <button className="link" onClick={() => setSent(false)}>לשנות כתובת או לשלוח שוב</button>
        </div>
      )}
    </main>
  );
}

export function Waiting({ name, onRefresh, onSignOut }) {
  // Check again every 30 seconds, so the moment she's approved, Day 1 simply appears.
  useEffect(() => {
    const t = setInterval(onRefresh, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <main className="gate" style={{ alignContent: 'center' }}>
      <div className="sun" />
      <div className="gate-title">
        <p className="brand small-brand" dir="ltr">JOURNEY</p>
        <h1>כמעט שם{name ? `, ${name}` : ''}</h1>
        <p>קיבלנו את ההרשמה שלך. ברגע שהגישה תאושר, הבוקר הראשון שלך ייפתח כאן.</p>
      </div>
      <p className="key-line">{KEY_LINE[0]}<br />{KEY_LINE[1]}</p>
      <button className="btn white" style={{ justifySelf: 'center' }} onClick={onRefresh}>לבדוק שוב</button>
      <button className="link" style={{ justifySelf: 'center' }} onClick={onSignOut}>התנתקות</button>
    </main>
  );
}

export function Closed({ onSignOut }) {
  return (
    <main className="gate" style={{ alignContent: 'center' }}>
      <div className="sun" />
      <div className="gate-title">
        <p className="brand small-brand" dir="ltr">JOURNEY</p>
        <h1>הגישה לחשבון הזה סגורה</h1>
        <p>אם נראה לך שזו טעות, כתבי לנו ונבדוק.</p>
      </div>
      <button className="link" style={{ justifySelf: 'center' }} onClick={onSignOut}>התנתקות</button>
    </main>
  );
}

export function Loading() {
  return (
    <main className="gate" style={{ alignContent: 'center' }}>
      <div className="sun" />
      <div className="gate-title"><p className="brand" dir="ltr">JOURNEY</p></div>
    </main>
  );
}
