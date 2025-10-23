const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileUpdate() {
  console.log('🔍 DEBUGGING PROFILE UPDATE ISSUE...\n');

  try {
    // Step 1: Check if profiles table exists and has data
    console.log('1️⃣ Checking profiles table...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      console.log('Full error:', profilesError);
      return;
    }

    console.log('✅ Profiles table accessible');
    console.log(`📊 Found ${profiles.length} profiles`);

    if (profiles.length === 0) {
      console.log('⚠️  No profiles found - this might be the issue!');
      console.log('💡 User might not have a profile record');
      return;
    }

    // Step 2: Check RLS policies
    console.log('\n2️⃣ Checking RLS policies...');
    console.log('ℹ️  RLS policies check skipped (not available in this setup)');

    // Step 3: Test profile update with service role
    console.log('\n3️⃣ Testing profile update with service role...');

    const testProfile = profiles[0];
    const originalName = testProfile.display_name;
    const newName = 'Debug Test ' + Date.now();

    console.log('👤 Test profile:', {
      id: testProfile.id,
      current_name: originalName,
      new_name: newName,
    });

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
      console.log('Error code:', updateError.code);
      console.log('Error hint:', updateError.hint);
    } else {
      console.log('✅ Profile update successful with service role');
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
          display_name: originalName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testProfile.id);

      if (revertError) {
        console.log('⚠️  Revert failed:', revertError.message);
      } else {
        console.log('✅ Profile reverted to original');
      }
    }

    // Step 4: Check auth users table
    console.log('\n4️⃣ Checking auth users...');

    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Cannot access auth users:', authError.message);
    } else {
      console.log('✅ Auth users accessible');
      console.log(`👥 Found ${authUsers.users.length} auth users`);

      // Check if profile user exists in auth
      const profileUser = authUsers.users.find(u => u.id === testProfile.id);
      if (profileUser) {
        console.log('✅ Profile user exists in auth');
        console.log('📧 User email:', profileUser.email);
        console.log('📅 Created:', profileUser.created_at);
      } else {
        console.log('❌ Profile user NOT found in auth - this is the problem!');
      }
    }

    // Step 5: Test with client-side auth (simulate app behavior)
    console.log('\n5️⃣ Testing client-side auth simulation...');

    // This simulates what happens in the app
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log('❌ Client auth error:', userError.message);
      console.log('💡 This explains why profile update fails in the app!');
    } else if (!user) {
      console.log('❌ No authenticated user found');
      console.log('💡 User needs to be logged in for profile update to work');
    } else {
      console.log('✅ Client auth working');
      console.log('👤 Authenticated user:', {
        id: user.id,
        email: user.email,
      });

      // Test profile update with client auth
      const { data: clientUpdate, error: clientError } = await supabase
        .from('profiles')
        .update({
          display_name: 'Client Test ' + Date.now(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (clientError) {
        console.log('❌ Client profile update failed:', clientError.message);
        console.log('💡 This is the actual error the app is seeing!');
      } else {
        console.log('✅ Client profile update successful');
        console.log('📊 Client updated profile:', clientUpdate);
      }
    }

    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('====================');

    if (profiles.length === 0) {
      console.log('❌ ISSUE: No profiles found in database');
      console.log(
        '💡 SOLUTION: User needs to sign up or profile needs to be created'
      );
    } else if (updateError) {
      console.log('❌ ISSUE: Database update failed');
      console.log('💡 SOLUTION: Check RLS policies and database permissions');
    } else if (userError || !user) {
      console.log('❌ ISSUE: User not authenticated in app');
      console.log('💡 SOLUTION: User needs to log in first');
    } else {
      console.log(
        '✅ All checks passed - issue might be in React Query or UI state'
      );
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProfileUpdate();
