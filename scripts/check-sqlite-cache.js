require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('🔍 Checking for any remaining data...');

  try {
    // Check checkins
    const { data: checkins, error: checkinError } = await supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (checkinError) {
      console.error('❌ Error checking checkins:', checkinError);
    } else {
      console.log('📝 Recent checkins:', checkins?.length || 0);
      if (checkins && checkins.length > 0) {
        checkins.forEach(c => {
          console.log(
            `  - ${c.date}: ${c.ayat_count} ayat (${c.user_id.slice(0, 8)}...)`
          );
        });
      }
    }

    // Check streaks
    const { data: streaks, error: streakError } = await supabase
      .from('streaks')
      .select('*')
      .limit(5);

    if (streakError) {
      console.error('❌ Error checking streaks:', streakError);
    } else {
      console.log('🔥 Recent streaks:', streaks?.length || 0);
      if (streaks && streaks.length > 0) {
        streaks.forEach(s => {
          console.log(
            `  - User ${s.user_id.slice(0, 8)}...: ${s.current} days`
          );
        });
      }
    }

    // Check users
    const { data: users, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error checking users:', userError);
    } else {
      console.log('👤 Total users:', users?.users?.length || 0);
      if (users?.users && users.users.length > 0) {
        users.users.slice(0, 3).forEach(u => {
          console.log(`  - ${u.email} (${u.id.slice(0, 8)}...)`);
        });
      }
    }

    console.log('');
    console.log('💡 If you still see "1 ayat" in the app:');
    console.log('   1. Restart the app completely');
    console.log('   2. Clear Metro cache: npx expo start --clear --port 8084');
    console.log('   3. Check if you have any local SQLite data (if on device)');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkData();
