// SAMPLE LIBRARY. In the real app the admin adds, edits and deletes these.
export const libraryCategories = [
  { id: 'all', label: 'הכול' },
  { id: 'listen', label: 'להאזנה' },
  { id: 'watch', label: 'לצפייה' },
  { id: 'games', label: 'המשחקים' },
  { id: 'print', label: 'להדפסה' },
];

export const libraryItems = [
  { id: 'l1', category: 'listen', kind: 'audio', title: '5 דקות של היזכרות', meta: '5 דק׳', description: 'אוזניות, עיניים עצומות, ורק להיזכר. מיום 3.' },
  { id: 'l2', category: 'listen', kind: 'audio', title: 'נשימה לרגעים שהכול יותר מדי', meta: '4 דק׳', description: 'לרגעים שבהם הגוף מתכווץ ואין זמן לכלום.' },
  { id: 'l3', category: 'games', kind: 'text', title: 'התרחבות / התכווצות', meta: 'דקה קריאה', description: 'המצפן של הגוף, לכל החלטה קטנה.',
    body: ['לפני החלטה קטנה, עצרי לשנייה ותשאלי:', '**זה מרחיב אותי או מכווץ אותי?**', 'לא צריך להבין למה. רק לשים לב. הגוף עונה מהר יותר מהראש.'] },
  { id: 'l4', category: 'games', kind: 'text', title: 'נקודת מבט מעניינת', meta: 'דקה קריאה', description: 'מה עושים עם מחשבה שמרגישה כמו אמת.',
    body: ['כשעולה מחשבה כמו "אני מאחור" או "אי אפשר", אל תתווכחי איתה.', 'פשוט תגידי: **"נקודת מבט מעניינת היא רק נקודת מבט מעניינת."**', 'ואז תשאלי: **ומה אני בוחרת?**'] },
  { id: 'l5', category: 'watch', kind: 'video', title: 'מפגש לייב: לחיות בלי לדעת', meta: '42 דק׳', description: 'שאלות, תשובות והרבה צחוק. הקלטה מהמפגש הקבוצתי.', art: 7 },
  { id: 'l6', category: 'print', kind: 'pdf', title: 'הוכחות שהחיים איתי', meta: 'PDF · 2 עמ׳', description: 'דף תיעוד לתיק ההוכחות, לטלפון או להדפסה.' },
  { id: 'l7', category: 'print', kind: 'pdf', title: 'טקס הוודאות שלי', meta: 'PDF · עמוד אחד', description: 'תבנית לטקס בוקר של 5–10 דקות, לתלות ליד המראה.' },
];

export const kindLabels = { audio: 'האזנה', video: 'צפייה', text: 'קריאה', pdf: 'להדפסה' };
