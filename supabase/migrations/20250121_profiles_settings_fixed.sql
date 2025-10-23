-- ========== TABLES ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text default 'Asia/Jakarta',
  language text default 'id',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Privacy
  hasanat_visible boolean default false,
  share_with_family boolean default false,
  join_leaderboard boolean default false,

  -- Notifications
  daily_reminder_enabled boolean default true,
  reminder_time time default '06:00:00',
  streak_warning_enabled boolean default true,
  family_nudge_enabled boolean default true,
  milestone_celebration_enabled boolean default true,

  -- Reading preferences
  daily_goal_ayat int default 5,
  theme text default 'light',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint theme_check check (theme in ('light','dark','auto'))
);

-- Indexes
create index if not exists idx_profiles_display_name on public.profiles(display_name);

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = id);

drop policy if exists settings_own_rw on public.user_settings;
create policy settings_own_rw on public.user_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== updated_at TRIGGERS ==========
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_settings on public.user_settings;
create trigger set_updated_at_user_settings
before update on public.user_settings
for each row execute function public.set_updated_at();

-- ========== ON SIGNUP SEED ==========
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name','User'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== STORAGE (AVATARS) ==========
-- Create bucket (public read) for avatars
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

-- Policies: public read, authenticated write/update
create policy if not exists avatars_public_read
on storage.objects for select
using (bucket_id = 'avatars');

create policy if not exists avatars_user_write
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy if not exists avatars_user_update
on storage.objects for update
using (bucket_id = 'avatars' and auth.role() = 'authenticated')
with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- (Optional) Per-user stricter policy via path prefix bisa ditambah nanti.

-- ========== BACKFILL EXISTING USERS ==========
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'name','User')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_settings (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id);
