import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enableHasanatForUser() {
  console.log('🌟 Enabling hasanat for user...');

  try {
    // Get first user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, hasanat_visible')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const user = profiles[0];
    console.log('👤 Found user:', user.name, '(ID:', user.user_id, ')');
    console.log('📊 Current hasanat_visible:', user.hasanat_visible);

    // Enable hasanat for this user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ hasanat_visible: true })
      .eq('user_id', user.user_id);

    if (updateError) {
      console.error('❌ Error enabling hasanat:', updateError.message);
      return;
    }

    console.log('✅ Hasanat enabled for user:', user.name);

    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabase
      .from('profiles')
      .select('user_id, name, hasanat_visible')
      .eq('user_id', user.user_id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
    } else {
      console.log('✅ Verification successful:', updatedUser);
      console.log(
        '📊 hasanat_visible is now:',
        updatedUser.hasanat_visible ? '✅ Enabled' : '❌ Disabled'
      );
    }

    console.log('\n🎉 Hasanat enabled successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Open the app and login as this user');
    console.log('2. Check ProfileScreen for Hasanat card');
    console.log('3. Check KhatamProgressScreen for Hasanat badge');
    console.log('4. Check StatsScreen for Hasanat summary card');
    console.log('5. Try logging a reading session to see hasanat alert');
  } catch (error) {
    console.error('💥 Error enabling hasanat:', error);
  }
}

enableHasanatForUser();
