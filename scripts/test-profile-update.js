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
  console.log('🧪 Testing Profile Update Functionality...\n');

  try {
    // Test 1: Check if profiles table exists
    console.log('1️⃣ Checking profiles table...');

    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles table not found:', profilesError.message);
      console.log('Please run the SQL migration first');
      return;
    }

    console.log('✅ Profiles table exists');

    // Test 2: Get a test user
    console.log('\n2️⃣ Getting test user...');

    const { data: profiles, error: profilesListError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, timezone')
      .limit(1);

    if (profilesListError || !profiles || profiles.length === 0) {
      console.log('❌ No profiles found for testing');
      return;
    }

    const testProfile = profiles[0];
    console.log('👤 Test profile:', {
      id: testProfile.id,
      display_name: testProfile.display_name,
      timezone: testProfile.timezone,
    });

    // Test 3: Test profile update
    console.log('\n3️⃣ Testing profile update...');

    const newName = 'Test User ' + Date.now();
    console.log('📝 Updating name to:', newName);

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testProfile.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Profile update failed:', updateError.message);
      console.log('Error details:', updateError);
    } else {
      console.log('✅ Profile update successful');
      console.log('📊 Updated profile:', {
        id: updatedProfile.id,
        display_name: updatedProfile.display_name,
        updated_at: updatedProfile.updated_at,
      });

      // Revert change
      console.log('\n🔄 Reverting change...');
      const { error: revertError } = await supabase
        .from('profiles')
        .update({
          display_name: testProfile.display_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testProfile.id);

      if (revertError) {
        console.log('⚠️  Revert failed:', revertError.message);
      } else {
        console.log('✅ Profile reverted to original');
      }
    }

    // Test 4: Test initial avatar generation
    console.log('\n4️⃣ Testing initial avatar generation...');

    const testNames = [
      'Ahmad Rizki',
      'Siti Nurhaliza',
      'Muhammad',
      'Fatimah Az-Zahra',
      'Ali bin Abi Thalib',
    ];

    testNames.forEach(name => {
      const words = name.trim().split(' ');
      let initials;
      if (words.length === 1) {
        initials = words[0].substring(0, 2).toUpperCase();
      } else {
        initials = (
          words[0].charAt(0) + words[words.length - 1].charAt(0)
        ).toUpperCase();
      }
      console.log(`📝 ${name} → ${initials}`);
    });

    console.log('\n🎉 Profile Update Test Completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('✅ Name editing should work with proper error handling');
    console.log('✅ Avatar should show initials based on name');
    console.log('✅ Avatar colors should be consistent for same name');
    console.log('✅ Real-time updates should work');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileUpdate();
