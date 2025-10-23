const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStreakSync() {
  console.log('🔍 Debugging Streak Sync Issues...\n');

  try {
    // 1. Get test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError);
      return;
    }

    const testUser = users[0];
    console.log('👤 Test user:', testUser.display_name, '(ID:', testUser.user_id, ')');

    // 2. Check streaks table data
    console.log('\n📊 Checking streaks table data:');
    const { data: streaksData, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (streaksError) {
      console.error('❌ Error fetching streaks:', streaksError);
    } else {
      console.log('Streaks table data:', streaksData);
    }

    // 3. Check checkins table data
    console.log('\n📅 Checking checkins table data:');
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
    } else {
      console.log('Checkins table data:');
      checkinsData?.forEach((checkin) => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 4. Calculate streak manually from checkins
    console.log('\n🔥 Calculating streak manually from checkins:');

    if (checkinsData && checkinsData.length > 0) {
      let manualStreak = 0;
      let lastDate = null;

      // Sort by date descending
      const sortedCheckins = checkinsData.sort((a, b) => b.date.localeCompare(a.date));

      for (const checkin of sortedCheckins) {
        const checkinDate = new Date(checkin.date);

        if (!lastDate) {
          // First checkin (most recent)
          manualStreak = 1;
          lastDate = checkinDate;
        } else {
          const daysDiff = Math.floor((lastDate - checkinDate) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            // Consecutive day
            manualStreak++;
            lastDate = checkinDate;
          } else {
            // Gap found, streak breaks
            break;
          }
        }
      }

      console.log('Manual streak calculation:', manualStreak, 'days');
      console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);
    }

    // 5. Check if streaks table needs update
    console.log('\n🔄 Checking if streaks table needs update:');

    if (streaksData && streaksData.length > 0) {
      const dbStreak = streaksData[0];
      console.log('Database streak:', dbStreak.current, 'days');
      console.log('Database last_date:', dbStreak.last_date);
    } else {
      console.log('No streak data in database - needs to be created');
    }

    // 6. Test RPC function
    console.log('\n🧪 Testing RPC function:');

    const today = new Date().toISOString().split('T')[0];
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: today,
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('RPC result:', rpcResult);
    }

    // 7. Check streaks table again after RPC
    console.log('\n📊 Checking streaks table after RPC:');
    const { data: streaksDataAfter, error: streaksErrorAfter } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (streaksErrorAfter) {
      console.error('❌ Error fetching streaks after RPC:', streaksErrorAfter);
    } else {
      console.log('Streaks table data after RPC:', streaksDataAfter);
    }

    console.log('\n✅ Debug completed!');
    console.log('\n🔍 Issues found:');
    console.log('1. Home screen uses streaks table data');
    console.log('2. Calendar uses checkins table data');
    console.log('3. These two sources may be out of sync');
    console.log('4. RPC function may not be working correctly');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStreakSync();
