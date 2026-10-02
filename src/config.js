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

// Community videos
export const MAX_VIDEO_SECONDS = 180;
// Largest upload we accept (MB). Must not exceed the Supabase plan's per-file limit.
export const MAX_UPLOAD_MB = 50;
