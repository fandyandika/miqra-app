const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...\n');

    // 1. Delete all family memberships
    console.log('1. Deleting all family memberships...');
    const { error: membersError } = await supabase
      .from('family_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (membersError) {
      console.error('❌ Error deleting family members:', membersError);
    } else {
      console.log('✅ Family memberships deleted');
    }

    // 2. Delete all families
    console.log('2. Deleting all families...');
    const { error: familiesError } = await supabase
      .from('families')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (familiesError) {
      console.error('❌ Error deleting families:', familiesError);
    } else {
      console.log('✅ Families deleted');
    }

    // 3. Delete all checkins
    console.log('3. Deleting all checkins...');
    const { error: checkinsError } = await supabase
      .from('checkins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (checkinsError) {
      console.error('❌ Error deleting checkins:', checkinsError);
    } else {
      console.log('✅ Checkins deleted');
    }

    // 4. Delete all streaks
    console.log('4. Deleting all streaks...');
    const { error: streaksError } = await supabase
      .from('streaks')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (streaksError) {
      console.error('❌ Error deleting streaks:', streaksError);
    } else {
      console.log('✅ Streaks deleted');
    }

    // 5. Delete all profiles
    console.log('5. Deleting all profiles...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (profilesError) {
      console.error('❌ Error deleting profiles:', profilesError);
    } else {
      console.log('✅ Profiles deleted');
    }

    // 6. Delete all invite codes
    console.log('6. Deleting all invite codes...');
    const { error: invitesError } = await supabase
      .from('invite_codes')
      .delete()
      .neq('code', 'dummy'); // Delete all

    if (invitesError) {
      console.error('❌ Error deleting invite codes:', invitesError);
    } else {
      console.log('✅ Invite codes deleted');
    }

    // 7. Delete all device tokens
    console.log('7. Deleting all device tokens...');
    const { error: tokensError } = await supabase
      .from('device_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (tokensError) {
      console.error('❌ Error deleting device tokens:', tokensError);
    } else {
      console.log('✅ Device tokens deleted');
    }

    console.log('\n✅ Cleanup completed!');
    console.log('💡 Now restart your app to clear React Query cache');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupTestData();
