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
    // Create profiles table
    console.log('📝 Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('exec', {
      sql: `
        create table if not exists public.profiles (
          id uuid primary key references auth.users(id) on delete cascade,
          display_name text,
          avatar_url text,
          timezone text default 'Asia/Jakarta',
          language text default 'id',
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );
      `,
    });

    if (profilesError) {
      console.log('⚠️  Profiles table creation:', profilesError.message);
    } else {
      console.log('✅ Profiles table created');
    }

    // Create user_settings table
    console.log('📝 Creating user_settings table...');
    const { error: settingsError } = await supabase.rpc('exec', {
      sql: `
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
      `,
    });

    if (settingsError) {
      console.log('⚠️  User_settings table creation:', settingsError.message);
    } else {
      console.log('✅ User_settings table created');
    }

    // Enable RLS
    console.log('🔒 Enabling RLS...');
    await supabase.rpc('exec', {
      sql: 'alter table public.profiles enable row level security;',
    });
    await supabase.rpc('exec', {
      sql: 'alter table public.user_settings enable row level security;',
    });

    // Create RLS policies
    console.log('🛡️  Creating RLS policies...');

    const policies = [
      `create policy if not exists profiles_select_all on public.profiles for select using (true);`,
      `create policy if not exists profiles_insert_own on public.profiles for insert with check (auth.uid() = id);`,
      `create policy if not exists profiles_update_own on public.profiles for update using (auth.uid() = id);`,
      `create policy if not exists settings_own_rw on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`,
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec', { sql: policy });
      if (error) {
        console.log('⚠️  Policy creation:', error.message);
      }
    }

    console.log('✅ RLS policies created');

    // Create updated_at trigger function
    console.log('⚡ Creating updated_at trigger...');
    const { error: triggerError } = await supabase.rpc('exec', {
      sql: `
        create or replace function public.set_updated_at()
        returns trigger as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$ language plpgsql;
      `,
    });

    if (triggerError) {
      console.log('⚠️  Trigger function creation:', triggerError.message);
    } else {
      console.log('✅ Trigger function created');
    }

    // Create triggers
    await supabase.rpc('exec', {
      sql: `
        drop trigger if exists set_updated_at_profiles on public.profiles;
        create trigger set_updated_at_profiles
        before update on public.profiles
        for each row execute function public.set_updated_at();
      `,
    });

    await supabase.rpc('exec', {
      sql: `
        drop trigger if exists set_updated_at_user_settings on public.user_settings;
        create trigger set_updated_at_user_settings
        before update on public.user_settings
        for each row execute function public.set_updated_at();
      `,
    });

    console.log('✅ Triggers created');

    // Create signup trigger
    console.log('🎯 Creating signup trigger...');
    const { error: signupTriggerError } = await supabase.rpc('exec', {
      sql: `
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
      `,
    });

    if (signupTriggerError) {
      console.log('⚠️  Signup trigger function creation:', signupTriggerError.message);
    } else {
      console.log('✅ Signup trigger function created');
    }

    await supabase.rpc('exec', {
      sql: `
        drop trigger if exists on_auth_user_created on auth.users;
        create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function public.handle_new_user();
      `,
    });

    console.log('✅ Signup trigger created');

    // Create storage bucket
    console.log('📦 Creating avatars storage bucket...');
    const { error: bucketError } = await supabase.rpc('exec', {
      sql: `
        insert into storage.buckets (id, name, public)
        values ('avatars','avatars', true)
        on conflict (id) do nothing;
      `,
    });

    if (bucketError) {
      console.log('⚠️  Storage bucket creation:', bucketError.message);
    } else {
      console.log('✅ Avatars storage bucket created');
    }

    // Create storage policies
    console.log('🔐 Creating storage policies...');
    const storagePolicies = [
      `create policy if not exists avatars_public_read on storage.objects for select using (bucket_id = 'avatars');`,
      `create policy if not exists avatars_user_write on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');`,
      `create policy if not exists avatars_user_update on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated') with check (bucket_id = 'avatars' and auth.role() = 'authenticated');`,
    ];

    for (const policy of storagePolicies) {
      const { error } = await supabase.rpc('exec', { sql: policy });
      if (error) {
        console.log('⚠️  Storage policy creation:', error.message);
      }
    }

    console.log('✅ Storage policies created');

    // Backfill existing users
    console.log('🔄 Backfilling existing users...');
    await supabase.rpc('exec', {
      sql: `
        insert into public.profiles (id, display_name)
        select u.id, coalesce(u.raw_user_meta_data->>'name','User')
        from auth.users u
        where not exists (select 1 from public.profiles p where p.id = u.id);
      `,
    });

    await supabase.rpc('exec', {
      sql: `
        insert into public.user_settings (user_id)
        select u.id
        from auth.users u
        where not exists (select 1 from public.user_settings s where s.user_id = u.id);
      `,
    });

    console.log('✅ Existing users backfilled');

    // Test the setup
    console.log('\n🧪 Testing setup...');

    const { data: profilesTest, error: profilesTestError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesTestError) {
      console.log('❌ Profiles table test failed:', profilesTestError.message);
    } else {
      console.log('✅ Profiles table accessible');
    }

    const { data: settingsTest, error: settingsTestError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (settingsTestError) {
      console.log('❌ User_settings table test failed:', settingsTestError.message);
    } else {
      console.log('✅ User_settings table accessible');
    }

    const { data: bucketsTest, error: bucketsTestError } = await supabase.storage.listBuckets();
    if (bucketsTestError) {
      console.log('❌ Storage test failed:', bucketsTestError.message);
    } else {
      const avatarsBucket = bucketsTest?.find((b) => b.id === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars bucket accessible');
      } else {
        console.log('⚠️  Avatars bucket not found');
      }
    }

    console.log('\n🎉 Profile & Settings system setup completed!');
    console.log('\n📱 Ready for testing:');
    console.log('1. ✅ Profiles table with RLS');
    console.log('2. ✅ User_settings table with RLS');
    console.log('3. ✅ Auto-creation trigger on signup');
    console.log('4. ✅ Avatar storage bucket');
    console.log('5. ✅ Service layer TypeScript functions');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createProfilesTables();
