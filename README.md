# JOURNEY

מחרדה לשגשוג בתוך אי־ודאות ב־9 ימים. 9 בקרים. 9 ניסויים קטנים בחיים שלך.

- `src/` – the app (React, no build tools needed besides esbuild)
- `src/data/days.js` – the 9 days content (source for `supabase/02_content.sql`)
- `supabase/` – database setup: `01_structure.sql` (tables, privacy rules, storage), `02_content.sql` (days + library)
- `site/` – the built real app (published by Netlify)
- `dist/index.html` – the design preview with sample content

Build: `npm install && npm run build`

Deploy: every push to `main` builds and publishes `site/` to GitHub Pages (`.github/workflows/deploy.yml`) – https://noyabartimor2.github.io/journey/
Vercel config (`vercel.json`) is also included.
