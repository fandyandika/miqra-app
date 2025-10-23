const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalFixes() {
  console.log('🧪 Testing Final Fixes...\n');

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

    // 2. Check current data
    console.log('\n📊 Current data:');

    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Checkins:', checkins?.length || 0);
    checkins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: streaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Streaks:', streaks);

    // 3. Test calendar data for current month
    console.log('\n📅 Calendar data for current month:');
    const currentMonth = new Date();
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data: monthCheckins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', testUser.user_id)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });

    console.log('Month checkins:', monthCheckins?.length || 0);
    monthCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 4. Test streak calculation for each day
    console.log('\n⚡ Testing streak calculation for each day:');

    const checkinMap =
      monthCheckins?.reduce((acc, checkin) => {
        acc[checkin.date] = checkin.ayat_count;
        return acc;
      }, {}) || {};

    // Test streak for each day in the month
    for (let day = 1; day <= end.getDate(); day++) {
      const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = testDate.toISOString().split('T')[0];
      const hasCheckin = checkinMap[dateStr] && checkinMap[dateStr] > 0;

      if (hasCheckin) {
        // Calculate streak backwards from this date
        let dayStreak = 0;
        let currentDate = new Date(testDate);

        while (true) {
          const currentDateStr = currentDate.toISOString().split('T')[0];
          const hasCheckinOnDate = checkinMap[currentDateStr] && checkinMap[currentDateStr] > 0;

          if (hasCheckinOnDate) {
            dayStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        const shouldShowEmoji = dayStreak >= 2;
        console.log(`  ${dateStr}: ${dayStreak} day streak ${shouldShowEmoji ? '⚡' : ''}`);
      }
    }

    console.log('\n✅ Final fixes test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Calendar should start from Monday');
    console.log('2. Day labels: Sen, Sel, Rab, Kam, Jum, Sab, Aha');
    console.log('3. Emoji ⚡ only shows for 2+ consecutive days');
    console.log('4. Home screen should show correct streak (not 0)');
    console.log('5. Debug logs should show streak data in console');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFinalFixes();
