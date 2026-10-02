// The sales page (site/join/). Built from the real content of the 9 days.
// The join button goes to JOIN_URL; until payment is connected it shows "opening soon".
import { days, KEY_LINE, SUBTITLE, TAGLINE } from '../data/days.js';
import { JOIN_URL, PRICE_FULL, PRICE_NOW } from '../config.js';

function JoinButton({ label = 'אני מצטרפת ל־JOURNEY' }) {
  if (!JOIN_URL) {
    return (
      <div className="sales-join">
        <button className="btn primary block" disabled>ההרשמה נפתחת ממש בקרוב</button>
      </div>
    );
  }
  return (
    <div className="sales-join">
      <a className="btn primary block" href={JOIN_URL}>{label}</a>
    </div>
  );
}

function Price() {
  return (
    <div className="sales-price" aria-label={`במקום ${PRICE_FULL} שקלים, עכשיו ${PRICE_NOW} שקלים`}>
      <span className="was">₪{PRICE_FULL}</span>
      <span className="now">₪{PRICE_NOW}</span>
      <span className="note">מחיר מיוחד למצטרפות עכשיו</span>
    </div>
  );
}

const INSIDE = [
  { emoji: '🎬', title: 'סרטון בוקר קצר', text: 'כל בוקר נפתח בשאלה אחת ובסרטון שמכניס אותך ליום.' },
  { emoji: '✍️', title: 'משימה אחת', text: 'ניסוי קטן ופרקטי בחיים האמיתיים שלך. לא עוד תיאוריה.' },
  { emoji: '🎲', title: 'המשחק של היום', text: 'משהו קליל שלוקחים איתך לאורך היום ומשנה את נקודת המבט.' },
  { emoji: '💬', title: 'קהילה', text: 'נשים שעוברות את המסע יחד איתך, משתפות ומפרגנות.' },
  { emoji: '🎧', title: 'ספרייה', text: 'הקלטות, משחקים ודפים להדפסה, לחזור אליהם מתי שצריך.' },
  { emoji: '🔒', title: 'מרחב אישי', text: 'הסרטונים, התשובות והטקס שלך. רק את רואה אותם.' },
];

const STEPS = [
  { title: 'מצטרפת ומשלמת', text: 'תשלום מאובטח, לוקח דקה.' },
  { title: 'מקבלת מייל כניסה', text: 'קישור אישי, בלי סיסמאות. לחיצה אחת ואת בפנים.' },
  { title: 'יום 1 נפתח מיד', text: 'אפשר להתחיל באותו רגע.' },
  { title: 'כל בוקר ב־08:00', text: 'נפתח יום חדש ומגיעה אלייך תזכורת. 9 בקרים, עד יום 9.' },
];

const FOR_YOU = [
  'את בתקופה של חוסר בהירות: בעבודה, בזוגיות, בכסף או בכיוון בחיים.',
  'הראש לא מפסיק לנסות לפתור, לתכנן ולדאוג.',
  'נמאס לך לחכות שהכול יסתדר כדי להתחיל לחיות.',
  'בא לך משהו קטן, יומיומי ומעשי. לא עוד קורס ארוך שלא מסיימים.',
];

const FAQ = [
  { q: 'כמה זמן זה לוקח ביום?', a: 'לא הרבה: סרטון קצר ומשימה אחת. המשחק של היום כבר קורה תוך כדי החיים, בלי לפנות לו זמן מיוחד.' },
  { q: 'מתי אני מתחילה?', a: 'מיד. ברגע שהתשלום עובר, נשלח אלייך מייל כניסה ויום 1 פתוח. יום 2 נפתח למחרת ב־08:00, וכך כל בוקר עד יום 9.' },
  { q: 'מה אם פספסתי בוקר?', a: 'שום דבר לא נעלם. ימים שכבר נפתחו נשארים פתוחים, ואפשר לחזור אליהם מתי שנוח לך.' },
  { q: 'צריך להוריד אפליקציה?', a: 'לא. JOURNEY עובד מהדפדפן בטלפון או במחשב. אפשר להוסיף אותו למסך הבית ואז הוא מרגיש בדיוק כמו אפליקציה.' },
  { q: 'מי רואה את מה שאני כותבת ומצלמת?', a: 'הסרטונים, התשובות והטקס במרחב האישי גלויים רק לך. בקהילה רואים רק מה שבחרת לשתף.' },
  { q: 'איך נכנסים?', a: 'עם המייל שאיתו שילמת. מקבלים קישור כניסה למייל, בלי סיסמה.' },
];

export function SalesPage() {
  return (
    <div className="app sales">
      <header className="gate sales-hero">
        <div className="sun" />
        <div className="gate-title">
          <p className="brand" dir="ltr">JOURNEY</p>
          <h1>{SUBTITLE}</h1>
          <p>{TAGLINE}</p>
        </div>
        <p className="key-line">{KEY_LINE[0]}<br />{KEY_LINE[1]}</p>
        <Price />
        <JoinButton />
        <a className="link sales-signin" href="../">כבר הצטרפתי, לכניסה</a>
      </header>

      <main className="sales-body">
        <section className="sales-section prose">
          <p>ומה אם התקופה הזאת היא לא תקלה?</p>
          <p>יש תקופות שבהן שום דבר לא ברור. לא יודעות מה יהיה עם העבודה, עם הכסף, עם הזוגיות, עם הכיוון. הראש רץ, הגוף מתכווץ, ונדמה שהחיים יתחילו רק אחרי שהכול יסתדר.</p>
          <p>JOURNEY הוא מסע של 9 בקרים שבו את לא מחכה שהוודאות תגיע. בכל בוקר ניסוי קטן אחד בחיים האמיתיים שלך: להוריד רעש, לחזור לגוף, ליהנות גם באמצע, ולגלות שאפשר לשגשג בדיוק מכאן.</p>
        </section>

        <section className="sales-section">
          <p className="eyebrow">למי זה מתאים</p>
          <h2>JOURNEY בשבילך אם</h2>
          <ul className="sales-list">
            {FOR_YOU.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <section className="sales-section">
          <p className="eyebrow">9 בקרים</p>
          <h2>המסע, יום אחרי יום</h2>
          <ol className="sales-days">
            {days.map((d) => (
              <li key={d.number}>
                <span className="num">{d.number}</span>
                <div>
                  <p className="title">{d.title} <span aria-hidden="true">{d.emoji}</span></p>
                  <p className="q">{d.question}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="note sales-center">וביום 9 את פוגשת שוב את הסרטון שצילמת ביום הראשון.</p>
        </section>

        <section className="sales-section">
          <p className="eyebrow">מה מחכה לך בפנים</p>
          <h2>כל בוקר באותו מבנה, כדי שתמיד תדעי איפה את</h2>
          <div className="sales-grid">
            {INSIDE.map((i) => (
              <div className="sales-card" key={i.title}>
                <span className="emoji" aria-hidden="true">{i.emoji}</span>
                <p className="title">{i.title}</p>
                <p>{i.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sales-section">
          <p className="eyebrow">איך זה עובד</p>
          <h2>מהרגע שאת מצטרפת</h2>
          <ol className="sales-steps">
            {STEPS.map((s) => (
              <li key={s.title}>
                <p className="title">{s.title}</p>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sales-section sales-offer">
          <h2>מוכנה לבוקר הראשון?</h2>
          <Price />
          <JoinButton />
        </section>

        <section className="sales-section">
          <p className="eyebrow">שאלות</p>
          <h2>שאלות נפוצות</h2>
          <div className="sales-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="sales-footer">
          <p className="brand small-brand" dir="ltr">JOURNEY</p>
          <a className="link" href="../">כבר הצטרפתי, לכניסה</a>
        </footer>
      </main>
    </div>
  );
}
