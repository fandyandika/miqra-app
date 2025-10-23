const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalendarFixes() {
  console.log('🧪 Testing Calendar Fixes...\n');

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

    // 2. Get current checkin data
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('📊 Current checkin data:');
    checkins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 3. Calculate streak manually
    console.log('\n🔥 Calculating streak manually...');

    let currentStreak = 0;
    let lastDate = null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Sort checkins by date descending
    const sortedCheckins = checkins?.sort((a, b) => b.date.localeCompare(a.date)) || [];

    for (const checkin of sortedCheckins) {
      const checkinDate = new Date(checkin.date);

      if (!lastDate) {
        // First checkin (most recent)
        currentStreak = 1;
        lastDate = checkinDate;
      } else {
        const daysDiff = Math.floor((lastDate - checkinDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          lastDate = checkinDate;
        } else {
          // Gap found, streak breaks
          break;
        }
      }
    }

    console.log('🔥 Current streak:', currentStreak, 'days');
    console.log('📅 Last checkin date:', lastDate?.toISOString().split('T')[0]);

    // 4. Test calendar data for current month
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthCheckins =
      checkins?.filter((checkin) => {
        const checkinDate = new Date(checkin.date);
        return checkinDate >= monthStart && checkinDate <= monthEnd;
      }) || [];

    console.log('\n📅 Calendar data for current month:');
    console.log(
      'Month:',
      currentMonth.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    );
    console.log('Days with readings:', monthCheckins.length);

    monthCheckins.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 5. Test streak calculation for each day
    console.log('\n⚡ Testing streak calculation for each day:');

    const checkinMap = monthCheckins.reduce((acc, checkin) => {
      acc[checkin.date] = checkin.ayat_count;
      return acc;
    }, {});

    // Test streak for each day in the month
    for (let day = 1; day <= monthEnd.getDate(); day++) {
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

        console.log(`  ${dateStr}: ${dayStreak} day streak`);
      }
    }

    console.log('\n✅ Calendar fixes test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Only ONE calendar in Progress tab (StreakCalendar)');
    console.log('2. All reading days show ⚡ emoji');
    console.log('3. Colors based on streak length:');
    console.log('   - Green: 1-6 days');
    console.log('   - Blue: 7-29 days');
    console.log('   - Gold: 30-99 days');
    console.log('   - Pink: 100+ days');
    console.log('4. Streak calculation should be accurate');
    console.log('5. Calendar should sync with real checkin data');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCalendarFixes();
