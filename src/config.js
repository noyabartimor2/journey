// App settings. The two Supabase values are public by design (they ship inside every app);
// the data itself is protected by the privacy rules in the database.
export const SUPABASE_URL = 'https://yioqhwclhiajeamwauvh.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_rvX2H8AJiOeDCBKlW5tn1g_CBMm1yDA';

// Turn on once Google sign-in is set up in Supabase.
export const GOOGLE_SIGNIN = false;

// Sales page (site/join/). JOIN_URL stays empty until Grow payment is connected.
export const PRICE_FULL = 890;
export const PRICE_NOW = 449;
export const JOIN_URL = '';
// After a successful payment Grow sends her here (set as the success / return URL in Grow).
// The page only says thank you; access is opened by the server once Grow confirms the payment,
// and the sign-in link in her email (and the button on this page) open the app on its home screen.
export const THANKS_URL = 'https://noyabartimor2.github.io/journey/join/thanks/';

// Who the sign-in emails come from, shown so she can search her inbox.
// These are Supabase's defaults; change both once a custom email sender (e.g. "JOURNEY") is set up.
export const EMAIL_SENDER_NAME = 'Supabase Auth';
export const EMAIL_SENDER_ADDRESS = 'noreply@mail.app.supabase.io';

// Community videos
export const MAX_VIDEO_SECONDS = 180;
// Largest upload we accept (MB). Must not exceed the Supabase plan's per-file limit.
export const MAX_UPLOAD_MB = 50;
