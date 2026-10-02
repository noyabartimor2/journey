-- =====================================================================
-- JOURNEY: database setup (part 3: access for the app)
-- Newer Supabase projects don't give the app access to new tables automatically.
-- This grants it. The privacy rules (RLS) from part 1 still decide which ROWS
-- each person may see or change, so this does not open anything up.
-- Paste into Supabase > SQL Editor > New query > Run. Safe to run more than once.
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- Her own profile: read it; she may only change her name and photo.
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- Content, progress, private space and community (rows protected by RLS).
grant select, insert, update, delete on
  public.days, public.library_items, public.progress, public.private_items,
  public.posts, public.post_media, public.comments, public.likes
to authenticated;

-- Views used by the community.
grant select on public.members, public.feed to authenticated;

-- Helper functions the app and the privacy rules call.
grant execute on function
  public.is_admin(), public.is_approved(), public.my_current_day(),
  public.current_day_for(uuid), public.day_unlock_time(timestamptz, int),
  public.admin_set_status(uuid, text)
to authenticated;

-- The admin list stays private: no access from the app (is_admin() reads it on its own).
revoke all on public.admins from anon, authenticated;
