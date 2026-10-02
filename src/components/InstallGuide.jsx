// "Add JOURNEY to your home screen": step-by-step for iPhone and Android,
// opened from the personal space and from a small tip card on the Today screen.
import { Sheet } from './ui.jsx';
import { isIOS, isAndroid, inAppBrowser, iosNotSafari, isStandalone, useInstallPrompt, remember } from '../lib/device.js';
const { useState } = React;

// The iPhone "share" icon (a square with an arrow up), drawn so she recognises it.
function ShareIcon() {
  return (
    <svg className="inline-icon" width="18" height="18" viewBox="0 0 24 24" aria-label="כפתור השיתוף">
      <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function PlusSquare() {
  return (
    <svg className="inline-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const IPHONE = [
  <>פותחים את JOURNEY ב־<strong>Safari</strong> (הדפדפן עם המצפן הכחול).</>,
  <>לוחצים על כפתור השיתוף <ShareIcon /> בתחתית המסך. באייפד הוא למעלה.</>,
  <>גוללים מעט למטה ובוחרים <strong>"הוספה למסך הבית"</strong> <PlusSquare />.</>,
  <>לוחצים <strong>"הוספה"</strong> למעלה. זהו, האייקון של JOURNEY מחכה במסך הבית ✨</>,
];
const ANDROID = [
  <>פותחים את JOURNEY ב־<strong>Chrome</strong>.</>,
  <>לוחצים על שלוש הנקודות <strong>⋮</strong> בפינה העליונה.</>,
  <>בוחרים <strong>"הוספה למסך הבית"</strong> או <strong>"התקנת אפליקציה"</strong>.</>,
  <>מאשרים <strong>"הוספה"</strong>. האייקון של JOURNEY יופיע במסך הבית ✨</>,
];

export function InstallGuideSheet({ onClose }) {
  const [tab, setTab] = useState(isAndroid ? 'android' : 'iphone');
  const [canPrompt, install] = useInstallPrompt();
  const installed = isStandalone();
  const steps = tab === 'iphone' ? IPHONE : ANDROID;

  return (
    <Sheet title="להוסיף את JOURNEY למסך הבית" onClose={onClose}>
      <div className="stack install">
        {installed ? (
          <div className="install-done">
            <p className="big">✓</p>
            <p><strong>JOURNEY כבר על מסך הבית שלך.</strong></p>
            <p className="note">מעכשיו פותחים אותו מהאייקון, כמו כל אפליקציה.</p>
          </div>
        ) : (
          <>
            <p className="install-why">ככה JOURNEY נפתח בלחיצה אחת, במסך מלא, כמו אפליקציה, וקל לחזור אליו כל בוקר.</p>

            {inAppBrowser && (
              <div className="install-warn">
                <strong>רגע לפני: את בתוך אינסטגרם או אפליקציה אחרת.</strong>
                <p>משם אי אפשר להוסיף למסך הבית. לוחצים על <strong>⋯</strong> בפינה ובוחרים <strong>"פתיחה בדפדפן"</strong> (או "Open in Safari / Chrome"), ואז ממשיכים בשלבים.</p>
              </div>
            )}
            {iosNotSafari && !inAppBrowser && (
              <div className="install-warn">
                <strong>באייפון זה עובד הכי טוב מ־Safari.</strong>
                <p>מעתיקים את הכתובת, פותחים אותה ב־Safari וממשיכים בשלבים.</p>
              </div>
            )}

            {canPrompt && (
              <button className="btn primary block" onClick={install}>להתקין את JOURNEY עכשיו</button>
            )}

            <div className="seg install-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'iphone'} className={tab === 'iphone' ? 'on' : ''} onClick={() => setTab('iphone')}>אייפון</button>
              <button role="tab" aria-selected={tab === 'android'} className={tab === 'android' ? 'on' : ''} onClick={() => setTab('android')}>אנדרואיד</button>
            </div>

            <ol className="install-steps">
              {steps.map((s, i) => <li key={i}><span className="n">{i + 1}</span><p>{s}</p></li>)}
            </ol>

            <div className="install-note">
              <strong>בכניסה הראשונה מהאייקון</strong>
              <p>ייתכן שתתבקשי להתחבר שוב. מבקשים קישור כניסה, ובמייל שמגיע יש גם <strong>קוד</strong>. מקלידים את הקוד בתוך JOURNEY, וככה נשארים מחוברות באפליקציה שעל מסך הבית.</p>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

// A small tip on the Today screen until she installs or dismisses it.
const TIP_KEY = 'journey.installTip';
export function InstallTip({ onOpen }) {
  const [hidden, setHidden] = useState(() => isStandalone() || remember.get(TIP_KEY) === 'hidden' || !(isIOS || isAndroid));
  if (hidden) return null;
  const dismiss = () => { remember.set(TIP_KEY, 'hidden'); setHidden(true); };
  return (
    <div className="install-tip">
      <span className="emoji" aria-hidden="true">📲</span>
      <button className="install-tip-text" onClick={onOpen}>
        <strong>להוסיף את JOURNEY למסך הבית</strong>
        <span>פתיחה בלחיצה אחת, כמו אפליקציה. איך עושים?</span>
      </button>
      <button className="icon-btn" onClick={dismiss} aria-label="לא עכשיו">✕</button>
    </div>
  );
}
