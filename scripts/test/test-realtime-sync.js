const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtimeSync() {
  console.log('🔄 Testing Real-time Sync...\n');

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

    // 2. Check current state
    console.log('\n📊 Current state:');

    const { data: currentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Current checkins:', currentCheckins?.length || 0);
    currentCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: currentStreaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Current streaks:', currentStreaks);

    // 3. Create a new checkin to trigger real-time sync
    console.log('\n📝 Creating new checkin to test real-time sync...');

    const today = new Date().toISOString().split('T')[0];
    const { data: newCheckin, error: checkinError } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUser.user_id,
          date: today,
          ayat_count: 35,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select();

    if (checkinError) {
      console.error('❌ Error creating checkin:', checkinError);
      return;
    }

    console.log('✅ New checkin created:', newCheckin);

    // 4. Recalculate streak
    console.log('\n🧮 Recalculating streak...');

    const { data: updatedCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    let newStreak = 0;
    let lastDate = null;

    if (updatedCheckins && updatedCheckins.length > 0) {
      const sortedCheckins = updatedCheckins.sort((a, b) => b.date.localeCompare(a.date));

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      newStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        console.log(`  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

        if (daysDiff === 1) {
          newStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${newStreak}`);
        } else {
          console.log(`    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`);
          break;
        }
      }
    }

    console.log(`New calculated streak: ${newStreak} days`);
    console.log(`Last checkin: ${lastDate?.toISOString().split('T')[0]}`);

    // 5. Update streaks table
    console.log('\n🔧 Updating streaks table...');

    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
          current: newStreak,
          longest: Math.max(0, newStreak),
          last_date: lastDate?.toISOString().split('T')[0] || null,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select();

    if (updateError) {
      console.error('❌ Error updating streaks:', updateError);
    } else {
      console.log('✅ Streaks updated:', updateResult);
    }

    // 6. Verify the update
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

    // 7. Test calendar emoji logic with new data
    console.log('\n⚡ Testing calendar emoji logic with new data:');

    const checkinMap =
      updatedCheckins?.reduce((acc, checkin) => {
        acc[checkin.date] = checkin.ayat_count;
        return acc;
      }, {}) || {};

    // Test each day
    const testDates = ['2025-10-18', '2025-10-20', '2025-10-21', today];

    for (const dateStr of testDates) {
      const date = new Date(dateStr);
      const hasCheckin = checkinMap[dateStr] && checkinMap[dateStr] > 0;

      if (hasCheckin) {
        // Check if this day is part of a consecutive sequence
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split('T')[0];
        const hasPrevDay = checkinMap[prevDayStr] && checkinMap[prevDayStr] > 0;

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        const hasNextDay = checkinMap[nextDayStr] && checkinMap[nextDayStr] > 0;

        const shouldShowEmoji = hasPrevDay || hasNextDay;
        const emoji = shouldShowEmoji ? '⚡' : '';

        console.log(`  ${dateStr}: ${checkinMap[dateStr]} ayat ${emoji}`);
      }
    }

    console.log('\n✅ Real-time sync test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show streak:', newStreak, 'days');
    console.log('2. Calendar should show ⚡ emoji for consecutive days');
    console.log('3. All data should be real-time synced');
    console.log('4. Debug logs should show updated data');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealtimeSync();
