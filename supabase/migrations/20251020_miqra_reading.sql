-- Reading sessions and progress schema (Miqra)
-- Use "ayat" consistently

create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surah_number int not null check (surah_number between 1 and 114),
  ayat_start int not null check (ayat_start >= 1),
  ayat_end int not null check (ayat_end >= ayat_start),
  ayat_count int generated always as (ayat_end - ayat_start + 1) stored,
  date date not null default (current_date),
  session_time timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_surah int not null default 1,
  current_ayat int not null default 1,
  total_ayat_read int not null default 0,
  khatam_count int not null default 0,
  last_read_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_date on public.reading_sessions(user_id, date desc);
create index if not exists idx_sessions_surah on public.reading_sessions(surah_number);

alter table public.reading_sessions enable row level security;
alter table public.reading_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='reading_sessions' and policyname='session_owner_rw'
  ) then
    create policy session_owner_rw on public.reading_sessions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='reading_progress' and policyname='progress_owner_rw'
  ) then
    create policy progress_owner_rw on public.reading_progress
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- NOTE: table checkins must already exist with column: user_id uuid, date date, ayat_count int
-- We'll upsert cumulative ayat_count per user per date


