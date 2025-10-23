-- ========== FIX PROFILES TABLE SCHEMA ==========
-- This migration fixes the profiles table to match the expected schema

-- First, let's see what we have
-- Current: user_id, display_name, timezone, lat, lng, created_at
-- Expected: id, display_name, avatar_url, timezone, language, created_at, updated_at

-- Step 1: Add missing columns
alter table public.profiles 
add column if not exists avatar_url text,
add column if not exists language text default 'id',
add column if not exists updated_at timestamptz default now();

-- Step 2: Rename user_id to id (this is tricky, so we'll do it step by step)
-- First, drop the foreign key constraint
alter table public.profiles drop constraint if exists profiles_user_id_fkey;

-- Rename the column
alter table public.profiles rename column user_id to id;

-- Re-add the foreign key constraint with the new column name
alter table public.profiles 
add constraint profiles_id_fkey 
foreign key (id) references auth.users(id) on delete cascade;

-- Step 3: Update RLS policies to use 'id' instead of 'user_id'
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "upsert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile" on public.profiles 
for select using (auth.uid() = id);

create policy "upsert own profile" on public.profiles 
for insert with check (auth.uid() = id);

create policy "update own profile" on public.profiles 
for update using (auth.uid() = id);

-- Step 4: Add updated_at trigger
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

-- Step 5: Update existing records to have updated_at
update public.profiles 
set updated_at = created_at 
where updated_at is null;

-- Step 6: Make updated_at not null
alter table public.profiles 
alter column updated_at set not null;

-- Step 7: Add index on display_name if it doesn't exist
create index if not exists idx_profiles_display_name on public.profiles(display_name);

-- Step 8: Verify the schema
-- The profiles table should now have:
-- id (uuid, primary key, references auth.users(id))
-- display_name (text)
-- avatar_url (text, nullable)
-- timezone (text, default 'Asia/Jakarta')
-- language (text, default 'id')
-- lat (double precision, nullable) - keeping for backward compatibility
-- lng (double precision, nullable) - keeping for backward compatibility
-- created_at (timestamptz, default now())
-- updated_at (timestamptz, not null, with trigger)
