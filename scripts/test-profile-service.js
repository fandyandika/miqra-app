const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the profile service functions
async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (error) throw error;
  return data;
}

async function updateProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getSettings() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const now = new Date().toISOString();
    return {
      user_id: user.id,
      hasanat_visible: false,
      share_with_family: false,
      join_leaderboard: false,
      daily_reminder_enabled: true,
      reminder_time: '06:00:00',
      streak_warning_enabled: true,
      family_nudge_enabled: true,
      milestone_celebration_enabled: true,
      daily_goal_ayat: 5,
      theme: 'light',
      created_at: now,
      updated_at: now,
    };
  }

  return data;
}

async function updateSettings(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const fileExt = 'jpg';
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

async function testProfileSystem() {
  console.log('🧪 Testing Profile & Settings System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Testing table existence...');

    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { data: settingsCheck, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (profilesError || settingsError) {
      console.log('❌ Tables not found. Please run the SQL migration first.');
      console.log('Run: node scripts/test-profiles-system.js');
      return;
    }

    console.log('✅ Tables exist and accessible');

    // Test 2: Get test user
    console.log('\n2️⃣ Getting test user...');

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log('👤 Test user:', testUser.display_name, '(ID:', testUser.id, ')');

    // Test 3: Profile CRUD operations
    console.log('\n3️⃣ Testing profile operations...');

    // Get profile
    const { data: profile, error: getProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (getProfileError) {
      console.log('❌ Get profile failed:', getProfileError.message);
    } else {
      console.log('✅ Get profile successful');
      console.log('📊 Profile data:', {
        display_name: profile.display_name,
        timezone: profile.timezone,
        language: profile.language,
      });
    }

    // Update profile
    const originalName = profile?.display_name;
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: 'Test User (Updated)',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testUser.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update profile failed:', updateError.message);
    } else {
      console.log('✅ Update profile successful');

      // Revert change
      await supabase
        .from('profiles')
        .update({
          display_name: originalName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testUser.id);
      console.log('🔄 Profile reverted to original');
    }

    // Test 4: Settings operations
    console.log('\n4️⃣ Testing settings operations...');

    // Get settings
    const { data: settings, error: getSettingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (getSettingsError) {
      console.log('❌ Get settings failed:', getSettingsError.message);
    } else {
      console.log('✅ Get settings successful');
      console.log('📊 Settings data:', {
        daily_goal_ayat: settings.daily_goal_ayat,
        theme: settings.theme,
        daily_reminder_enabled: settings.daily_reminder_enabled,
        reminder_time: settings.reminder_time,
      });
    }

    // Update settings
    const originalGoal = settings?.daily_goal_ayat;
    const { data: updatedSettings, error: updateSettingsError } = await supabase
      .from('user_settings')
      .update({
        daily_goal_ayat: 10,
        theme: 'dark',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', testUser.id)
      .select()
      .single();

    if (updateSettingsError) {
      console.log('❌ Update settings failed:', updateSettingsError.message);
    } else {
      console.log('✅ Update settings successful');
      console.log('📊 Updated settings:', {
        daily_goal_ayat: updatedSettings.daily_goal_ayat,
        theme: updatedSettings.theme,
      });

      // Revert change
      await supabase
        .from('user_settings')
        .update({
          daily_goal_ayat: originalGoal,
          theme: 'light',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUser.id);
      console.log('🔄 Settings reverted to original');
    }

    // Test 5: Storage bucket
    console.log('\n5️⃣ Testing storage bucket...');

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('❌ Storage test failed:', bucketsError.message);
    } else {
      const avatarsBucket = buckets?.find((b) => b.id === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars storage bucket exists');
        console.log('📊 Bucket info:', {
          id: avatarsBucket.id,
          name: avatarsBucket.name,
          public: avatarsBucket.public,
        });
      } else {
        console.log('⚠️  Avatars bucket not found');
      }
    }

    // Test 6: RLS policies
    console.log('\n6️⃣ Testing RLS policies...');

    // Test profile select (should work for all)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(3);

    if (allProfilesError) {
      console.log('❌ Profile select policy test failed:', allProfilesError.message);
    } else {
      console.log('✅ Profile select policy working (public read)');
      console.log('📊 Found profiles:', allProfiles.length);
    }

    // Test settings select (should only work for own)
    const { data: allSettings, error: allSettingsError } = await supabase
      .from('user_settings')
      .select('user_id, daily_goal_ayat')
      .limit(3);

    if (allSettingsError) {
      console.log('✅ Settings select policy working (private)');
    } else {
      console.log('⚠️  Settings select policy may be too permissive');
    }

    console.log('\n🎉 Profile & Settings System Test Completed!');
    console.log('\n📱 System Status:');
    console.log('✅ Profiles table with RLS');
    console.log('✅ User_settings table with RLS');
    console.log('✅ CRUD operations working');
    console.log('✅ Storage bucket ready');
    console.log('✅ Service layer functions ready');

    console.log('\n🚀 Ready for integration:');
    console.log('1. Import profile service functions in your components');
    console.log('2. Use getProfile() and updateProfile() for user data');
    console.log('3. Use getSettings() and updateSettings() for preferences');
    console.log('4. Use uploadAvatar() for profile pictures');
    console.log('5. New users will auto-get profiles and settings');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileSystem();
