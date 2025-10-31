const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfilesTables() {
  console.log('🔄 Creating profiles and user_settings tables...\n');

  try {
    // Check if tables already exist
    console.log('🔍 Checking if tables exist...');

    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { data: settingsCheck, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (!profilesError && !settingsError) {
      console.log('✅ Tables already exist!');
      return;
    }

    console.log('📝 Tables not found, creating them...');
    console.log('⚠️  This requires manual SQL execution in Supabase Dashboard');
    console.log('\n📋 Please run the following SQL in Supabase SQL Editor:');

    const migrationSQL = `
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
  hasanat_visible boolean default false,
  share_with_family boolean default false,
  join_leaderboard boolean default false,
  daily_reminder_enabled boolean default true,
  reminder_time time default '06:00:00',
  streak_warning_enabled boolean default true,
  family_nudge_enabled boolean default true,
  milestone_celebration_enabled boolean default true,
  daily_goal_ayat int default 5,
  theme text default 'light',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint theme_check check (theme in ('light','dark','auto'))
);

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

create policy if not exists profiles_select_all on public.profiles for select using (true);
create policy if not exists profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy if not exists profiles_update_own on public.profiles for update using (auth.uid() = id);
create policy if not exists settings_own_rw on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== TRIGGERS ==========
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_user_settings before update on public.user_settings for each row execute function public.set_updated_at();

-- ========== SIGNUP TRIGGER ==========
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

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ========== BACKFILL EXISTING USERS ==========
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'name','User')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_settings (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id);
`;

    console.log(migrationSQL);

    console.log('\n📝 After running the SQL, run this script again to test the setup.');
    console.log('Or run: node scripts/test-profile-functions.js');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createProfilesTables();
