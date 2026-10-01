// Generates supabase/02_content.sql: the 9 days and the starter library, from the app's content files.
import { writeFileSync } from 'node:fs';
import { days } from '../src/data/days.js';
import { libraryItems } from '../src/data/library.js';

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const j = (o) => `$json$${JSON.stringify(o)}$json$::jsonb`;

let sql = `-- =====================================================================
-- JOURNEY: database setup (part 2 of 2: the 9 days + starter library)
-- Paste into Supabase > SQL Editor > New query > Run, after part 1.
-- Running it again resets Days 1-9 to this text (YouTube links you already pasted are kept).
-- =====================================================================

`;

for (const d of days) {
  const { number, title, emoji, question, video, ...rest } = d;
  sql += `insert into public.days (number, title, emoji, question, content) values (${number}, ${q(title)}, ${q(emoji)}, ${q(question)}, ${j(rest)})
on conflict (number) do update set title = excluded.title, emoji = excluded.emoji, question = excluded.question, content = excluded.content, updated_at = now();

`;
}

sql += `-- Starter library (only added if the library is still empty).
do $$
begin
  if not exists (select 1 from public.library_items) then
`;
libraryItems.forEach((it, i) => {
  sql += `    insert into public.library_items (category, kind, title, description, meta, body, sort) values (${q(it.category)}, ${q(it.kind)}, ${q(it.title)}, ${q(it.description)}, ${q(it.meta)}, ${it.body ? j(it.body) : 'null'}, ${i});
`;
});
sql += `  end if;
end $$;
`;

writeFileSync(new URL('./02_content.sql', import.meta.url), sql);
console.log('Wrote supabase/02_content.sql', (sql.length / 1024).toFixed(0) + ' KB');
