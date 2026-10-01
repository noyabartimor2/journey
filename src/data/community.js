// SAMPLE COMMUNITY POSTS.
// Each post has a `media` list. Today it holds photos ({ type: 'image' }).
// Video support later = adding { type: 'video' } items, without changing posts or comments.
// `day` + `label` say which day's sharing task the post came from ("הוכחת שפע · יום 5").
const H = 60 * 60 * 1000;

export const currentUser = { id: 'me', name: 'נועה לוי', firstName: 'נועה', email: 'noa@example.com' };

export function samplePosts(now = Date.now()) {
  return [
    {
      id: 'p1', author: { id: 'u1', name: 'מיכל אברהם' }, createdAt: now - 1.2 * H, day: 5, label: 'הוכחת שפע',
      text: 'הנה זה: הבריסטה פשוט אמר "היום עליי". ואחרי שעה לקוחה ישנה כתבה לי משום מקום שהיא רוצה לחזור. אני רושמת הכול 📒',
      media: [], likes: 18, likedByMe: false,
      comments: [
        { id: 'c1', author: { id: 'u2', name: 'רותם' }, text: 'וואו! קיבלתי ממך הוכחה שזה אפשרי 🤍', createdAt: now - 1 * H },
      ],
    },
    {
      id: 'p2', author: { id: 'u3', name: 'שירה כהן' }, createdAt: now - 3 * H, day: 6, label: 'רגע של כיף',
      text: 'הדייט שלי עם החיים: גלידה בעשר בבוקר, על ספסל, בלי טלפון. הגרסה בת ה־8 שלי צרחה.',
      media: [{ type: 'image', art: 6 }], likes: 27, likedByMe: true,
      comments: [{ id: 'c3', author: { id: 'u4', name: 'דנה' }, text: 'יאאאאא 🍒', createdAt: now - 2.5 * H }],
    },
    {
      id: 'p3', author: { id: 'u4', name: 'דנה פרץ' }, createdAt: now - 6 * H, day: 2, label: 'במה אני גאה',
      text: '1. אני גאה שאני עדיין כאן.\n2. אני גאה בדרך שבה אני אוהבת את הילדים שלי.\n3. אני גאה שאמרתי לא לפרויקט שלא רציתי.\n4. אני גאה שלמדתי לבקש עזרה.\n…ועוד שש שלא נכנסו 😅',
      media: [], likes: 22, likedByMe: false,
      comments: [
        { id: 'c4', author: { id: 'u1', name: 'מיכל' }, text: 'מה שאני רואה בך: אומץ שקט. תמיד.', createdAt: now - 5 * H },
        { id: 'c5', author: { id: 'u5', name: 'יעל' }, text: 'מספר 3 👏👏', createdAt: now - 4 * H },
      ],
    },
    {
      id: 'p4', author: { id: 'u5', name: 'יעל מזרחי' }, createdAt: now - 20 * H, day: 7, label: 'תודעת זיבי',
      text: 'I choose to be free from הטיימליין שדמיינתי לעצמי בגיל 25.\nI choose to be free to להתחיל מחדש. שוב. ושוב אם צריך.',
      media: [], likes: 35, likedByMe: false, comments: [],
    },
    {
      id: 'p6', author: { id: 'u6', name: 'הדר לוין' }, createdAt: now - 9 * H, day: null,
      text: 'מישהי עוד קמה היום עם הלב בגרון? כותבת את זה פה כי פה אני יודעת שמבינים 🤍',
      media: [], likes: 24, likedByMe: false,
      comments: [
        { id: 'c7', author: { id: 'u3', name: 'שירה' }, text: 'כאן. נושמות יחד.', createdAt: now - 8.5 * H },
        { id: 'c8', author: { id: 'u2', name: 'רותם' }, text: 'גם אני. וזה עובר, כל פעם קצת יותר מהר.', createdAt: now - 8 * H },
      ],
    },
    {
      id: 'p7', author: { id: 'u1', name: 'מיכל אברהם' }, createdAt: now - 14 * H, day: null,
      text: 'השקיעה מהחלון הערב. סתם רציתי לשתף משהו יפה.',
      media: [{ type: 'image', art: 5 }], likes: 16, likedByMe: false, comments: [],
    },
    {
      id: 'p5', author: { id: 'u2', name: 'רותם שגיא' }, createdAt: now - 28 * H, day: 1,
      text: 'יום ראשון. שאלתי את הגוף אם להישאר בבית או לצאת. הוא אמר לצאת. צדק 🌿',
      media: [{ type: 'image', art: 2 }], likes: 31, likedByMe: false,
      comments: [{ id: 'c6', author: { id: 'u1', name: 'מיכל' }, text: 'מתחילות יחד!', createdAt: now - 27 * H }],
    },
  ];
}
