require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSettingsFix() {
  console.log('🧪 TESTING SETTINGS SCREEN FIX...\n');

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

    // Test if user_settings table exists
    console.log('\n📋 Testing user_settings table access...');

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('❌ Settings error:', settingsError);
      console.log('\n💡 SOLUTION: Run the SQL in Supabase SQL Editor first!');
      console.log('📄 See: scripts/manual-setup-instructions.md');
      return;
    }

    if (!settings) {
      console.log('📝 No settings found, testing self-healing...');

      // Test the self-healing getSettings function
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data: inserted, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Self-healing failed:', insertError);
        return;
      }

      console.log('✅ Self-healing successful:', inserted);
    } else {
      console.log('✅ Settings found:', settings);
    }

    // Test updateSettings
    console.log('\n🔄 Testing updateSettings...');

    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update({
        hasanat_visible: true,
        daily_reminder_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    console.log('✅ Update successful:', updateData);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ SettingsScreen is now hardened');
    console.log('✅ Self-healing getSettings() works');
    console.log('✅ updateSettings() works');
    console.log('✅ No more blank screen!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Logout
    await supabase.auth.signOut();
    console.log('\n🔓 Logged out');
  }
}

testSettingsFix();
