const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalVerification() {
  console.log('🧪 Final Verification Test...\n');

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
    console.log(
      '👤 Test user:',
      testUser.display_name,
      '(ID:',
      testUser.user_id,
      ')'
    );

    // 2. Check current data
    console.log('\n📊 Current data:');

    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Checkins:', checkins?.length || 0);
    checkins?.forEach(checkin => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: streaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Streaks:', streaks);

    // 3. Test calendar emoji logic
    console.log('\n🔥 Testing calendar emoji logic:');

    const checkinMap =
      checkins?.reduce((acc, checkin) => {
        acc[checkin.date] = checkin.ayat_count;
        return acc;
      }, {}) || {};

    // Test each day
    const testDates = ['2025-10-18', '2025-10-20', '2025-10-21'];

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
        const emoji = shouldShowEmoji ? '🔥' : '';

        console.log(`  ${dateStr}: ${checkinMap[dateStr]} ayat ${emoji}`);
      }
    }

    // 4. Test overall streak calculation
    console.log('\n📈 Testing overall streak calculation:');

    let currentStreak = 0;
    let lastDate = null;

    if (checkins && checkins.length > 0) {
      const sortedCheckins = checkins.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor(
          (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
          tempDate = checkinDate;
        } else {
          break;
        }
      }
    }

    console.log('Overall streak:', currentStreak, 'days');
    console.log('Last checkin:', lastDate?.toISOString().split('T')[0]);

    console.log('\n✅ Final verification completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show streak:', currentStreak, 'days');
    console.log('2. Calendar day labels: Sen, Sel, Rab, Kam, Jum, Sab, Aha');
    console.log('3. Calendar emoji logic:');
    console.log('   - 18 Oktober: 10 ayat (no emoji - isolated)');
    console.log('   - 20 Oktober: 15 ayat 🔥 (start of streak)');
    console.log('   - 21 Oktober: 20 ayat 🔥 (consecutive)');
    console.log('4. All data should be real-time synced');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFinalVerification();
