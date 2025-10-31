import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProfilesData() {
  console.log('🔍 Checking profiles data...');

  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message);
      return;
    }

    console.log('📊 Profiles found:', profiles?.length || 0);
    console.log('👥 Profiles data:', profiles);

    // Check auth.users table
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Users error:', usersError.message);
    } else {
      console.log('👤 Auth users found:', users?.users?.length || 0);
      if (users?.users && users.users.length > 0) {
        console.log('👤 First user:', {
          id: users.users[0].id,
          email: users.users[0].email,
          created_at: users.users[0].created_at,
        });
      }
    }

    // Check if we can create a test profile
    if (users?.users && users.users.length > 0) {
      const testUserId = users.users[0].id;
      console.log('\n🧪 Testing profile creation for user:', testUserId);

      const { data: testProfile, error: testError } = await supabase
        .from('profiles')
        .upsert({
          user_id: testUserId,
          name: 'Test User',
          hasanat_visible: true,
        })
        .select()
        .single();

      if (testError) {
        console.error('❌ Test profile creation error:', testError.message);
      } else {
        console.log('✅ Test profile created:', testProfile);
      }
    }
  } catch (error) {
    console.error('💥 Error checking profiles data:', error);
  }
}

checkProfilesData();
