// What kind of phone / browser she's on, for the "add to home screen" guide.
const ua = navigator.userAgent || '';
const { useState, useEffect } = React;

export const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(ua);
// Opened inside Instagram / Facebook / TikTok etc.: these can't add to the home screen.
export const inAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Snapchat|WhatsApp/i.test(ua);
// iPhone browsers that aren't Safari (Chrome, Firefox...) — on iOS only Safari reliably adds to the home screen.
export const iosNotSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);

export function isStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}

// Android/Chrome offers a real "install" prompt; keep it so a button can open it.
let deferredPrompt = null;
const promptListeners = new Set();
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  promptListeners.forEach((cb) => cb(true));
});

export function useInstallPrompt() {
  const [ready, setReady] = useState(!!deferredPrompt);
  useEffect(() => { promptListeners.add(setReady); return () => promptListeners.delete(setReady); }, []);
  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; setReady(false);
    return outcome === 'accepted';
  };
  return [ready, install];
}

// Small per-device memory (e.g. "I've seen the install tip"). Never required for anything to work.
export const remember = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};
