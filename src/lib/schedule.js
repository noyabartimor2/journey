// The challenge schedule. Everything runs on Israel time (Asia/Jerusalem),
// wherever the participant happens to be.
//
// Rule: Day 1 opens the moment the admin approves her.
// Day N (N >= 2) opens at 08:00 Israel time on the (N-1)th calendar day after approval.
// Example: approved Monday 15:00 -> Day 2 Tuesday 08:00, Day 3 Wednesday 08:00 ...

export const TIME_ZONE = 'Asia/Jerusalem';
export const UNLOCK_HOUR = 8;
export const TOTAL_DAYS = 9;

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function israelParts(date) {
  const o = {};
  for (const p of partsFormat.formatToParts(date)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
}

// How far Israel's clock is ahead of UTC at a given moment (handles summer/winter time).
function israelOffsetMs(date) {
  const p = israelParts(date);
  const asUTC = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUTC - Math.floor(date.getTime() / 1000) * 1000;
}

// Converts an Israel wall-clock time (e.g. 8:00 on 14 Oct) into an exact moment.
export function israelTimeToDate(y, m, d, h = 0, mi = 0) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - israelOffsetMs(new Date(guess));
  const second = guess - israelOffsetMs(new Date(t));
  if (second !== t) t = second;
  return new Date(t);
}

export function israelCalendarDate(date) {
  const p = israelParts(date);
  return { y: p.y, m: p.m, d: p.d };
}

export function israelHour(date) {
  return israelParts(date).h;
}

function addCalendarDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function sameCalendarDate(a, b) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function unlockTime(dayNumber, activatedAt) {
  const start = new Date(activatedAt);
  if (dayNumber <= 1) return start;
  const day = addCalendarDays(israelCalendarDate(start), dayNumber - 1);
  return israelTimeToDate(day.y, day.m, day.d, UNLOCK_HOUR, 0);
}

export function isUnlocked(dayNumber, activatedAt, now = new Date()) {
  return unlockTime(dayNumber, activatedAt).getTime() <= now.getTime();
}

// The newest day she can open right now (1-9).
export function currentDay(activatedAt, now = new Date()) {
  let current = 1;
  for (let n = 2; n <= TOTAL_DAYS; n++) {
    if (isUnlocked(n, activatedAt, now)) current = n;
    else break;
  }
  return current;
}

const weekdayFormat = new Intl.DateTimeFormat('he-IL', { timeZone: TIME_ZONE, weekday: 'long' });
const shortDateFormat = new Intl.DateTimeFormat('he-IL', { timeZone: TIME_ZONE, day: 'numeric', month: 'numeric' });

// "מחר ב־08:00" / "ביום שני ב־08:00"
export function unlockLabel(dayNumber, activatedAt, now = new Date()) {
  const when = unlockTime(dayNumber, activatedAt);
  const target = israelCalendarDate(when);
  const today = israelCalendarDate(now);
  const time = `${String(UNLOCK_HOUR).padStart(2, '0')}:00`;
  if (sameCalendarDate(target, today)) return `היום ב־${time}`;
  if (sameCalendarDate(target, addCalendarDays(today, 1))) return `מחר ב־${time}`;
  const daysAhead = Math.round((Date.UTC(target.y, target.m - 1, target.d) - Date.UTC(today.y, today.m - 1, today.d)) / 86400000);
  if (daysAhead < 7) return `ב${weekdayFormat.format(when)} ב־${time}`;
  return `ב־${shortDateFormat.format(when)}`;
}

// PREVIEW ONLY: invents an approval time so that "now" falls on the chosen day.
export function previewActivation(dayNumber, now = new Date()) {
  if (dayNumber <= 1) return new Date(now.getTime() - 60 * 1000);
  const today = israelCalendarDate(now);
  const beforeEight = israelHour(now) < UNLOCK_HOUR;
  const start = addCalendarDays(today, -(dayNumber - 1) - (beforeEight ? 1 : 0));
  return israelTimeToDate(start.y, start.m, start.d, 15, 0);
}
