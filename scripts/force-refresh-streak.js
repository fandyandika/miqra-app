const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRefreshStreak() {
  console.log('🔄 Force Refreshing Streak...\n');

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

    // 2. Get current checkins
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
      return;
    }

    console.log('📅 Current checkins:');
    checkins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 3. Calculate streak
    let currentStreak = 0;
    let lastDate = null;

    if (checkins && checkins.length > 0) {
      const sortedCheckins = checkins.sort((a, b) => b.date.localeCompare(a.date));

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        console.log(`  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

        if (daysDiff === 1) {
          currentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${currentStreak}`);
        } else {
          console.log(`    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`);
          break;
        }
      }
    }

    console.log('\n📊 Final calculation:');
    console.log('Current streak:', currentStreak, 'days');
    console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);

    // 4. Force update streaks table
    console.log('\n🔧 Force updating streaks table...');

    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
          current: currentStreak,
          longest: Math.max(0, currentStreak),
          last_date: lastDate?.toISOString().split('T')[0] || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select();

    if (updateError) {
      console.error('❌ Error updating streaks:', updateError);
    } else {
      console.log('✅ Streaks force updated:', updateResult);
    }

    // 5. Verify the update
    console.log('\n🔍 Verifying update...');
    const { data: verifyStreaks, error: verifyError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (verifyError) {
      console.error('❌ Error verifying streaks:', verifyError);
    } else {
      console.log('✅ Verification successful:', verifyStreaks);
    }

    // 6. Test RPC function
    console.log('\n🧪 Testing RPC function...');

    const today = new Date().toISOString().split('T')[0];
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: today,
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC result:', rpcResult);
    }

    console.log('\n✅ Force refresh completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show streak:', currentStreak, 'days');
    console.log('2. Calendar should show correct emojis');
    console.log('3. All data should be real-time synced');
    console.log('4. Debug logs should show updated data');
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
  }
}

forceRefreshStreak();
