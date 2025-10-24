import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatToggle() {
  console.log('🔄 Testing hasanat toggle functionality...');

  try {
    // Get first user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, hasanat_visible')
      .order('created_at', { ascending: true })
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const user = profiles[0];
    console.log('👤 Testing with user:', user.display_name);
    console.log('📊 Current hasanat_visible:', user.hasanat_visible);

    // Test 1: Toggle OFF
    console.log('\n1. Testing toggle OFF...');
    const { error: offError } = await supabase
      .from('profiles')
      .update({ hasanat_visible: false })
      .eq('user_id', user.user_id);

    if (offError) {
      console.error('❌ Error toggling OFF:', offError.message);
    } else {
      console.log('✅ Hasanat toggled OFF');

      // Verify OFF
      const { data: offUser, error: offVerifyError } = await supabase
        .from('profiles')
        .select('hasanat_visible')
        .eq('user_id', user.user_id)
        .single();

      if (offVerifyError) {
        console.error('❌ Error verifying OFF:', offVerifyError.message);
      } else {
        console.log('✅ Verified OFF:', offUser.hasanat_visible ? '❌ Still ON' : '✅ OFF');
      }
    }

    // Test 2: Toggle ON
    console.log('\n2. Testing toggle ON...');
    const { error: onError } = await supabase
      .from('profiles')
      .update({ hasanat_visible: true })
      .eq('user_id', user.user_id);

    if (onError) {
      console.error('❌ Error toggling ON:', onError.message);
    } else {
      console.log('✅ Hasanat toggled ON');

      // Verify ON
      const { data: onUser, error: onVerifyError } = await supabase
        .from('profiles')
        .select('hasanat_visible')
        .eq('user_id', user.user_id)
        .single();

      if (onVerifyError) {
        console.error('❌ Error verifying ON:', onVerifyError.message);
      } else {
        console.log('✅ Verified ON:', onUser.hasanat_visible ? '✅ ON' : '❌ Still OFF');
      }
    }

    // Test 3: Final status
    console.log('\n3. Final status check...');
    const { data: finalUser, error: finalError } = await supabase
      .from('profiles')
      .select('user_id, display_name, hasanat_visible')
      .eq('user_id', user.user_id)
      .single();

    if (finalError) {
      console.error('❌ Error getting final status:', finalError.message);
    } else {
      console.log('📊 Final status:', finalUser);
      console.log('🎯 hasanat_visible:', finalUser.hasanat_visible ? '✅ ENABLED' : '❌ DISABLED');
    }

    console.log('\n🎉 Hasanat toggle test completed!');
    console.log('\n📋 Expected behavior in app:');
    console.log('- When hasanat_visible = false: No hasanat UI should appear');
    console.log('- When hasanat_visible = true: Hasanat UI should appear');
    console.log('- ProgressScreen should respect this setting (FIXED)');
    console.log('- ProfileScreen, KhatamProgressScreen, StatsScreen should respect this setting');
  } catch (error) {
    console.error('💥 Error testing hasanat toggle:', error);
  }
}

testHasanatToggle();
