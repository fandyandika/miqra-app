import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enableHasanatFinal() {
  console.log('🌟 Enabling hasanat for users...');

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, hasanat_visible')
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message);
      return;
    }

    console.log('👥 Found profiles:', profiles?.length || 0);

    // Enable hasanat for the first user
    const firstUser = profiles?.[0];
    if (firstUser) {
      console.log(
        '👤 Enabling hasanat for:',
        firstUser.display_name,
        '(ID:',
        firstUser.user_id,
        ')'
      );
      console.log('📊 Current hasanat_visible:', firstUser.hasanat_visible);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ hasanat_visible: true })
        .eq('user_id', firstUser.user_id);

      if (updateError) {
        console.error('❌ Error enabling hasanat:', updateError.message);
        return;
      }

      console.log('✅ Hasanat enabled for:', firstUser.display_name);

      // Verify the update
      const { data: updatedUser, error: verifyError } = await supabase
        .from('profiles')
        .select('user_id, display_name, hasanat_visible')
        .eq('user_id', firstUser.user_id)
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
    }

    // Show all users status
    console.log('\n📊 All users hasanat status:');
    for (const profile of profiles || []) {
      console.log(
        `- ${profile.display_name}: ${profile.hasanat_visible ? '✅ Enabled' : '❌ Disabled'}`
      );
    }

    console.log('\n🎉 Hasanat setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open the app and login as the enabled user');
    console.log('2. Check ProfileScreen for Hasanat card');
    console.log('3. Check KhatamProgressScreen for Hasanat badge');
    console.log('4. Check StatsScreen for Hasanat summary card');
    console.log('5. Try logging a reading session to see hasanat alert');
    console.log('6. Test real-time updates by logging multiple sessions');
  } catch (error) {
    console.error('💥 Error enabling hasanat:', error);
  }
}

enableHasanatFinal();
