-- =====================================================================
-- JOURNEY: database setup (part 1 of 2: structure and privacy rules)
-- Paste into Supabase > SQL Editor > New query > Run. Safe to run once.
-- =====================================================================

-- ---------- Who is who ----------------------------------------------

-- Admins are listed by email (the email they sign in with).
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- No policies: nobody can read or change this list from the app. Only from the Supabase dashboard.

-- One row per participant, created automatically when she signs up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  activated_at timestamptz,          -- the moment she was approved = her Day 1
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved' and p.activated_at is not null
  );
$$;

-- ---------- The 9-day schedule (Israel time) -------------------------
-- Day 1 opens at approval. Day N opens at 08:00 Asia/Jerusalem on the (N-1)th calendar day after.

create or replace function public.day_unlock_time(p_activated_at timestamptz, p_day int)
returns timestamptz language sql stable as $$
  select case
    when p_day <= 1 then p_activated_at
    else (((p_activated_at at time zone 'Asia/Jerusalem')::date + (p_day - 1)) + time '08:00')
         at time zone 'Asia/Jerusalem'
  end;
$$;

create or replace function public.current_day_for(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((
    select 1 + (select count(*)::int from generate_series(2, 9) as n
                where public.day_unlock_time(p.activated_at, n) <= now())
    from public.profiles p
    where p.id = p_user and p.status = 'approved' and p.activated_at is not null
  ), 0);
$$;

-- Her current day (0 = not approved yet).
create or replace function public.my_current_day()
returns int language sql stable security definer set search_path = public as $$
  select public.current_day_for(auth.uid());
$$;

-- New sign-up -> pending profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Approving her (status -> approved) starts her Day 1 automatically.
create or replace function public.stamp_activation()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and new.activated_at is null then
    new.activated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_stamp_activation on public.profiles;
create trigger profiles_stamp_activation before insert or update on public.profiles
  for each row execute function public.stamp_activation();

-- Profile rules: she sees and edits only her own name/photo. Admin sees and manages all.
drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: edit own name/photo" on public.profiles;
create policy "profiles: edit own name/photo" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
revoke update on public.profiles from authenticated, anon;
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- Admin-only: approve / block / change start date (used by the admin screens later).
create or replace function public.admin_set_status(p_user uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.profiles set status = p_status where id = p_user;
end;
$$;

-- Names and photos of approved members, for the community (no emails, no status).
create or replace view public.members as
  select p.id, p.display_name, p.avatar_path
  from public.profiles p
  where p.status = 'approved' and (public.is_approved() or public.is_admin());
grant select on public.members to authenticated;

-- ---------- Content: the 9 days and the library -----------------------

create table if not exists public.days (
  number int primary key check (number between 1 and 9),
  title text not null,
  emoji text not null default '',
  question text not null default '',
  youtube_url text,                  -- the creator's video: just a YouTube link, nothing stored here
  content jsonb not null default '{}'::jsonb,  -- intro, task, game, extra, share, moment
  updated_at timestamptz not null default now()
);
alter table public.days enable row level security;
-- A participant can only download days that are already open for her. Future days never leave the database.
drop policy if exists "days: open days only" on public.days;
create policy "days: open days only" on public.days for select using (number <= public.my_current_day() or public.is_admin());
drop policy if exists "days: admin edits" on public.days;
create policy "days: admin edits" on public.days for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'listen',
  kind text not null check (kind in ('audio', 'video', 'text', 'pdf')),
  title text not null,
  description text not null default '',
  meta text not null default '',
  body jsonb,                        -- for text items
  youtube_url text,                  -- for video items
  file_path text,                    -- for uploaded audio / PDF (in the "content" storage)
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.library_items enable row level security;
drop policy if exists "library: approved read" on public.library_items;
create policy "library: approved read" on public.library_items for select using (public.is_approved() or public.is_admin());
drop policy if exists "library: admin edits" on public.library_items;
create policy "library: admin edits" on public.library_items for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Her progress ----------------------------------------------

create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day int not null check (day between 1 and 9),
  completed_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.progress enable row level security;
drop policy if exists "progress: own read" on public.progress;
create policy "progress: own read" on public.progress for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "progress: complete open day" on public.progress;
create policy "progress: complete open day" on public.progress for insert
  with check (user_id = auth.uid() and day <= public.my_current_day());
drop policy if exists "progress: undo own" on public.progress;
create policy "progress: undo own" on public.progress for delete using (user_id = auth.uid());

-- ---------- Her private space (Day 1 & 9 videos, Day 8 answers, ritual) ----

create table if not exists public.private_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('day1_video', 'day9_video', 'purpose_answers', 'ritual')),
  data jsonb not null default '{}'::jsonb,
  video_path text,                   -- in the "private-videos" storage, inside her own folder
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.private_items enable row level security;
-- Only she can see or change these. Not other participants, not the admin screens.
drop policy if exists "private: only her" on public.private_items;
create policy "private: only her" on public.private_items for all
  using (user_id = auth.uid() and public.is_approved())
  with check (user_id = auth.uid() and public.is_approved());

-- ---------- Community -------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  day int check (day between 1 and 9),   -- empty = general post; a number = from that day's sharing task
  label text,                            -- e.g. 'הוכחת שפע'
  body text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
alter table public.posts enable row level security;
-- No spoilers: she sees general posts and posts from days already open for her (and always her own).
drop policy if exists "posts: no spoilers" on public.posts;
create policy "posts: no spoilers" on public.posts for select using (
  public.is_admin()
  or author_id = auth.uid()
  or (public.is_approved() and (day is null or day <= public.my_current_day()))
);
drop policy if exists "posts: approved can post" on public.posts;
create policy "posts: approved can post" on public.posts for insert with check (
  author_id = auth.uid() and public.is_approved() and (day is null or day <= public.my_current_day())
);
drop policy if exists "posts: delete own or admin" on public.posts;
create policy "posts: delete own or admin" on public.posts for delete using (author_id = auth.uid() or public.is_admin());

-- Photos now, videos (up to 3 minutes) too. One post can have several.
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  path text not null unique,             -- in the "community" storage
  duration_seconds numeric check (duration_seconds is null or duration_seconds <= 185),
  width int,
  height int,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  check (kind <> 'video' or duration_seconds is not null)
);
alter table public.post_media enable row level security;
drop policy if exists "media: visible with its post" on public.post_media;
create policy "media: visible with its post" on public.post_media for select using (
  exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "media: add to own post" on public.post_media;
create policy "media: add to own post" on public.post_media for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);
drop policy if exists "media: delete own or admin" on public.post_media;
create policy "media: delete own or admin" on public.post_media for delete using (
  public.is_admin() or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
alter table public.comments enable row level security;
drop policy if exists "comments: visible with its post" on public.comments;
create policy "comments: visible with its post" on public.comments for select using (
  exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "comments: approved can comment" on public.comments;
create policy "comments: approved can comment" on public.comments for insert with check (
  author_id = auth.uid() and public.is_approved() and exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "comments: delete own or admin" on public.comments;
create policy "comments: delete own or admin" on public.comments for delete using (author_id = auth.uid() or public.is_admin());

create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists "likes: visible with its post" on public.likes;
create policy "likes: visible with its post" on public.likes for select using (
  exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "likes: like" on public.likes;
create policy "likes: like" on public.likes for insert with check (
  user_id = auth.uid() and public.is_approved() and exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "likes: unlike" on public.likes;
create policy "likes: unlike" on public.likes for delete using (user_id = auth.uid());

-- The feed in one request: post + author + counts (follows all the rules above).
create or replace view public.feed with (security_invoker = true) as
  select
    p.id, p.author_id, p.day, p.label, p.body, p.created_at,
    m.display_name as author_name, m.avatar_path as author_avatar,
    (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
    (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
    exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
    coalesce((select jsonb_agg(jsonb_build_object('kind', pm.kind, 'path', pm.path, 'duration', pm.duration_seconds, 'width', pm.width, 'height', pm.height) order by pm.sort)
              from public.post_media pm where pm.post_id = p.id), '[]'::jsonb) as media
  from public.posts p
  left join public.members m on m.id = p.author_id;
grant select on public.feed to authenticated;

-- ---------- File storage ------------------------------------------------
-- All folders are private. Files are shown through short-lived links the app asks for.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  -- Size limits per file follow the Supabase plan for now (we set them once the plan is chosen).
  ('private-videos', 'private-videos', false, null,     array['video/*']),
  ('community',      'community',      false, null,     array['image/*', 'video/*']),
  ('avatars',        'avatars',        false, 10485760, array['image/*']),
  ('content',        'content',        false, null,     array['audio/*', 'application/pdf', 'image/*'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- private-videos: each participant has her own folder (named by her id). Only she can touch it.
drop policy if exists "private-videos: only her folder" on storage.objects;
create policy "private-videos: only her folder" on storage.objects for all to authenticated
  using (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved())
  with check (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());

-- community: she uploads into her own folder; others can open a file only if they may see its post.
drop policy if exists "community: upload own" on storage.objects;
create policy "community: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());
drop policy if exists "community: view if post visible" on storage.objects;
create policy "community: view if post visible" on storage.objects for select to authenticated
  using (bucket_id = 'community' and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.post_media pm where pm.path = storage.objects.name)
  ));
drop policy if exists "community: delete own or admin" on storage.objects;
create policy "community: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- avatars: she manages her own; approved members can see them.
drop policy if exists "avatars: manage own" on storage.objects;
create policy "avatars: manage own" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: members view" on storage.objects;
create policy "avatars: members view" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (public.is_approved() or public.is_admin()));

-- content: the admin uploads library audio / PDFs; approved participants can open them.
drop policy if exists "content: approved view" on storage.objects;
create policy "content: approved view" on storage.objects for select to authenticated
  using (bucket_id = 'content' and (public.is_approved() or public.is_admin()));
drop policy if exists "content: admin manages" on storage.objects;
create policy "content: admin manages" on storage.objects for all to authenticated
  using (bucket_id = 'content' and public.is_admin())
  with check (bucket_id = 'content' and public.is_admin());
