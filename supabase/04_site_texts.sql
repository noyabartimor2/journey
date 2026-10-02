-- =====================================================================
-- JOURNEY: database setup (part 4: editable site texts, e.g. the sales page)
-- Everyone (also visitors who aren't signed in) can read them; only admins can change them.
-- Paste into Supabase > SQL Editor > New query > Run. Safe to run more than once.
-- =====================================================================

create table if not exists public.site_texts (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;

drop policy if exists "site_texts: everyone reads" on public.site_texts;
create policy "site_texts: everyone reads" on public.site_texts for select using (true);
drop policy if exists "site_texts: admin edits" on public.site_texts;
create policy "site_texts: admin edits" on public.site_texts for all using (public.is_admin()) with check (public.is_admin());

grant select on public.site_texts to anon, authenticated;
grant insert, update on public.site_texts to authenticated;
