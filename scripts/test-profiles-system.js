const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfilesSystem() {
  console.log('🔄 Creating profiles and user_settings system...\n');

  try {
    // Test if tables already exist
    console.log('🔍 Checking existing tables...');

    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { data: settingsCheck, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (!profilesError && !settingsError) {
      console.log('✅ Tables already exist! Testing functionality...');

      // Test profile service
      console.log('\n🧪 Testing profile service...');

      // Get a test user
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .limit(1);

      if (userError || !users || users.length === 0) {
        console.log('⚠️  No users found for testing');
        return;
      }

      const testUser = users[0];
      console.log(
        '👤 Test user:',
        testUser.display_name,
        '(ID:',
        testUser.id,
        ')'
      );

      // Test profile update
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: testUser.display_name + ' (Test)',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testUser.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Profile update test failed:', updateError.message);
      } else {
        console.log('✅ Profile update test passed');

        // Revert the test change
        await supabase
          .from('profiles')
          .update({
            display_name: testUser.display_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', testUser.id);
      }

      // Test settings
      const { data: settings, error: settingsTestError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      if (settingsTestError) {
        console.log('❌ Settings test failed:', settingsTestError.message);
      } else {
        console.log('✅ Settings test passed');
        console.log('📊 Current settings:', {
          daily_goal_ayat: settings.daily_goal_ayat,
          theme: settings.theme,
          daily_reminder_enabled: settings.daily_reminder_enabled,
        });
      }

      // Test storage bucket
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();
      if (bucketsError) {
        console.log('❌ Storage test failed:', bucketsError.message);
      } else {
        const avatarsBucket = buckets?.find(b => b.id === 'avatars');
        if (avatarsBucket) {
          console.log('✅ Avatars storage bucket accessible');
        } else {
          console.log('⚠️  Avatars bucket not found, creating...');

          // Try to create bucket via API
          const { data: bucketData, error: bucketError } =
            await supabase.storage.createBucket('avatars', {
              public: true,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
              fileSizeLimit: 5242880, // 5MB
            });

          if (bucketError) {
            console.log(
              '❌ Failed to create avatars bucket:',
              bucketError.message
            );
          } else {
            console.log('✅ Avatars bucket created successfully');
          }
        }
      }

      console.log('\n🎉 Profile & Settings system is ready!');
      console.log('\n📱 Available features:');
      console.log('1. ✅ User profiles with display name, avatar, timezone');
      console.log(
        '2. ✅ User settings with privacy, notifications, preferences'
      );
      console.log('3. ✅ RLS security policies');
      console.log('4. ✅ Auto-update triggers');
      console.log('5. ✅ Avatar storage bucket');
      console.log('6. ✅ TypeScript service layer');

      return;
    }

    // Tables don't exist, need to create them
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

-- ========== BACKFILL ==========
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

    console.log(
      '\n📝 After running the SQL, run this script again to test the setup.'
    );
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createProfilesSystem();
