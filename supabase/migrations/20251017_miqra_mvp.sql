-- ========== TABLES ==========
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text default 'Asia/Jakarta',
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','member')) default 'member',
  created_at timestamptz default now(),
  unique(family_id, user_id)
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  ayat_count int not null check (ayat_count >= 0),
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current int default 0,
  longest int default 0,
  last_date date
);

create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  platform text check (platform in ('ios','android')) not null,
  created_at timestamptz default now(),
  unique(user_id, token)
);

create table if not exists invite_codes (
  code text primary key,
  family_id uuid references families(id) on delete cascade,
  ttl timestamptz not null,
  used boolean default false
);

-- ========== INDEXES ==========
create index if not exists idx_checkins_user_date on checkins(user_id, date desc);
create index if not exists idx_family_members_family on family_members(family_id);
create index if not exists idx_device_tokens_user on device_tokens(user_id);

-- ========== RLS ENABLE ==========
alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table checkins enable row level security;
alter table streaks enable row level security;
alter table device_tokens enable row level security;
alter table invite_codes enable row level security;

-- ========== RLS POLICIES ==========
-- profiles: self
drop policy if exists "read own profile" on profiles;
drop policy if exists "upsert own profile" on profiles;
drop policy if exists "update own profile" on profiles;
create policy "read own profile" on profiles for select using (auth.uid() = user_id);
create policy "upsert own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on profiles for update using (auth.uid() = user_id);

-- families: visible to members
drop policy if exists "select families for members" on families;
drop policy if exists "insert family" on families;
create policy "select families for members" on families
for select using (exists(select 1 from family_members fm where fm.family_id = id and fm.user_id = auth.uid()));
create policy "insert family" on families
for insert with check (auth.uid() = created_by);

-- family_members: see rows for families you belong to; insert self
drop policy if exists "select family members in my families" on family_members;
drop policy if exists "join family self" on family_members;
create policy "select family members in my families" on family_members
for select using (exists(select 1 from family_members fm2 where fm2.family_id = family_members.family_id and fm2.user_id = auth.uid()));
create policy "join family self" on family_members
for insert with check (auth.uid() = user_id);

-- checkins: self read/write
drop policy if exists "select own checkins" on checkins;
drop policy if exists "insert own checkins" on checkins;
drop policy if exists "update own checkins" on checkins;
create policy "select own checkins" on checkins for select using (auth.uid() = user_id);
create policy "insert own checkins" on checkins for insert with check (auth.uid() = user_id);
create policy "update own checkins" on checkins for update using (auth.uid() = user_id);

-- streaks: self
drop policy if exists "select own streaks" on streaks;
drop policy if exists "upsert own streaks" on streaks;
drop policy if exists "update own streaks" on streaks;
create policy "select own streaks" on streaks for select using (auth.uid() = user_id);
create policy "upsert own streaks" on streaks for insert with check (auth.uid() = user_id);
create policy "update own streaks" on streaks for update using (auth.uid() = user_id);

-- device_tokens: self
drop policy if exists "device tokens self" on device_tokens;
drop policy if exists "insert device token" on device_tokens;
drop policy if exists "delete device token" on device_tokens;
create policy "device tokens self" on device_tokens for select using (auth.uid() = user_id);
create policy "insert device token" on device_tokens for insert with check (auth.uid() = user_id);
create policy "delete device token" on device_tokens for delete using (auth.uid() = user_id);

-- invite_codes: public readable (code gate), writes via edge fn later
drop policy if exists "read invites" on invite_codes;
create policy "read invites" on invite_codes for select using (true);

-- ========== TRIGGER: set user_id if missing ==========
create or replace function set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then new.user_id := auth.uid(); end if;
  return new;
end $$;

drop trigger if exists t_set_user_checkins on checkins;
create trigger t_set_user_checkins before insert on checkins
for each row execute procedure set_user_id();

-- ========== RPC: update streak after checkin ==========
create or replace function update_streak_after_checkin(checkin_date date)
returns void language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
  s streaks%rowtype;
begin
  select * into s from streaks where user_id = uid for update;
  if not found then
    insert into streaks(user_id, current, longest, last_date)
    values(uid, 1, 1, checkin_date)
    on conflict (user_id) do nothing;
    return;
  end if;

  if s.last_date = checkin_date then
    return;
  elsif s.last_date = checkin_date - interval '1 day' then
    s.current := s.current + 1;
  else
    s.current := 1;
  end if;

  if s.current > s.longest then s.longest := s.current; end if;
  s.last_date := checkin_date;

  update streaks set current = s.current, longest = s.longest, last_date = s.last_date where user_id = uid;
end $$;

grant execute on function update_streak_after_checkin(date) to authenticated;


