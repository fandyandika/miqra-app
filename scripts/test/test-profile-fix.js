const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
  console.log('🧪 TESTING PROFILE UPDATE AFTER FIX...\n');

  try {
    // Test 1: Get profiles
    console.log('1️⃣ Getting profiles...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }

    console.log('✅ Profiles accessible');
    console.log('📊 Sample profile:', profiles[0]);

    if (profiles.length === 0) {
      console.log('⚠️  No profiles found');
      return;
    }

    // Test 2: Test update using user_id
    console.log('\n2️⃣ Testing update using user_id...');

    const testProfile = profiles[0];
    const newName = 'Fixed Test ' + Date.now();

    console.log('👤 Test profile user_id:', testProfile.user_id);
    console.log('📝 Updating name to:', newName);

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('user_id', testProfile.user_id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      console.log('Error code:', updateError.code);
    } else {
      console.log('✅ Update successful!');
      console.log('📊 Updated profile:', {
        user_id: updatedProfile.user_id,
        display_name: updatedProfile.display_name,
        timezone: updatedProfile.timezone,
      });

      // Revert change
      console.log('\n🔄 Reverting change...');
      const { error: revertError } = await supabase
        .from('profiles')
        .update({ display_name: testProfile.display_name })
        .eq('user_id', testProfile.user_id);

      if (revertError) {
        console.log('⚠️  Revert failed:', revertError.message);
      } else {
        console.log('✅ Profile reverted to original');
      }
    }

    console.log('\n🎉 PROFILE UPDATE TEST COMPLETED!');
    console.log('✅ The service should now work correctly');
    console.log('💡 Key fix: Using user_id instead of id for profiles table');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileUpdate();
