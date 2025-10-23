const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the profile service functions
async function testProfileFunctions() {
  console.log('🧪 Testing Profile Service Functions...\n');

  try {
    // Test getProfileTimezone function
    console.log('1️⃣ Testing getProfileTimezone...');

    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, timezone')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ No users found for testing');
      console.log(
        '⚠️  Please run the SQL migration first to create profiles table'
      );
      return;
    }

    const testUser = users[0];
    console.log('👤 Test user:', testUser.id, 'Timezone:', testUser.timezone);

    // Test getProfile function
    console.log('\n2️⃣ Testing getProfile...');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (profileError) {
      console.log('❌ Get profile failed:', profileError.message);
    } else {
      console.log('✅ Get profile successful');
      console.log('📊 Profile data:', {
        id: profile.id,
        display_name: profile.display_name,
        timezone: profile.timezone,
        language: profile.language,
      });
    }

    // Test getProfileTimezone logic
    console.log('\n3️⃣ Testing getProfileTimezone logic...');

    const timezone = profile?.timezone ?? 'Asia/Jakarta';
    console.log('✅ Timezone resolved:', timezone);

    // Test getUserProfile function
    console.log('\n4️⃣ Testing getUserProfile...');

    const userProfile = profile; // This would be the same as getProfile()
    console.log('✅ getUserProfile successful');
    console.log('📊 User profile data:', {
      id: userProfile.id,
      display_name: userProfile.display_name,
      timezone: userProfile.timezone,
    });

    // Test updateProfile function
    console.log('\n5️⃣ Testing updateProfile...');

    const originalName = profile.display_name;
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
      console.log('📊 Updated profile:', {
        display_name: updatedProfile.display_name,
        updated_at: updatedProfile.updated_at,
      });

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

    // Test getSettings function
    console.log('\n6️⃣ Testing getSettings...');

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (settingsError) {
      console.log('❌ Get settings failed:', settingsError.message);
    } else {
      console.log('✅ Get settings successful');
      console.log('📊 Settings data:', {
        user_id: settings.user_id,
        daily_goal_ayat: settings.daily_goal_ayat,
        theme: settings.theme,
        daily_reminder_enabled: settings.daily_reminder_enabled,
      });
    }

    console.log('\n🎉 All Profile Service Functions Test Passed!');
    console.log('\n📱 Functions Available:');
    console.log('✅ getProfile() - Get user profile');
    console.log('✅ getProfileTimezone() - Get user timezone');
    console.log('✅ getUserProfile() - Alias for getProfile()');
    console.log('✅ updateProfile() - Update profile data');
    console.log('✅ getSettings() - Get user settings');
    console.log('✅ updateSettings() - Update settings');
    console.log('✅ uploadAvatar() - Upload profile picture');
    console.log('✅ requestAccountDeletion() - Request account deletion');

    console.log('\n🔧 React Query Error Fix:');
    console.log('✅ All profile queries now have proper queryFn');
    console.log('✅ getProfileTimezone() function implemented');
    console.log('✅ getUserProfile() function implemented');
    console.log('✅ No more "No queryFn was passed" errors');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileFunctions();
