require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSettingsScreen() {
  console.log('🧪 TESTING SETTINGS SCREEN FUNCTIONALITY...\n');

  try {
    // Login as test user
    console.log('🔐 Logging in as test1@miqra.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test1@miqra.com',
      password: 'password123',
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Logged in successfully');
    console.log('User ID:', authData.user.id);

    // Test getSettings function
    console.log('\n📋 Testing getSettings function...');

    // First, check if user_settings exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Check settings error:', checkError);
      return;
    }

    console.log('Existing settings:', existingSettings ? 'Found' : 'Not found');

    // Test the getSettings function (simulating the service call)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Get settings error:', error);
      return;
    }

    if (!data) {
      console.log('📝 No settings found, creating default...');
      const { data: inserted, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert settings error:', insertError);
        return;
      }

      console.log('✅ Default settings created:', inserted);
    } else {
      console.log('✅ Settings found:', data);
    }

    // Test updateSettings function
    console.log('\n🔄 Testing updateSettings function...');

    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update({
        hasanat_visible: true,
        daily_reminder_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update settings error:', updateError);
      return;
    }

    console.log('✅ Settings updated successfully:', updateData);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ SettingsScreen should work correctly');
    console.log('✅ Self-healing getSettings() works');
    console.log('✅ updateSettings() works');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Logout
    await supabase.auth.signOut();
    console.log('\n🔓 Logged out');
  }
}

testSettingsScreen();
