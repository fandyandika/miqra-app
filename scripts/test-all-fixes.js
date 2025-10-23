const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllFixes() {
  console.log('🧪 Testing All Fixes...\n');

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

    // 2. Test user-specific checkin data
    console.log('\n📅 Testing user-specific checkin data:');
    const { data: checkinData, error: checkinError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (checkinError) {
      console.error('❌ Error fetching user checkins:', checkinError);
    } else {
      console.log('✅ User-specific checkins found:', checkinData.length);
      checkinData?.slice(0, 5).forEach(checkin => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 3. Test streak data
    console.log('\n🔥 Testing streak data:');
    const { data: streakData, error: streakError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (streakError) {
      console.error('❌ Error fetching streaks:', streakError);
    } else {
      console.log('✅ Streak data:', streakData);
    }

    // 4. Test calendar data for current month
    console.log('\n📅 Testing calendar data for current month:');
    const currentMonth = new Date();
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data: monthCheckins, error: monthError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', testUser.user_id)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });

    if (monthError) {
      console.error('❌ Error fetching month checkins:', monthError);
    } else {
      console.log('✅ Month checkins found:', monthCheckins.length);
      monthCheckins?.forEach(checkin => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 5. Test reading sessions
    console.log('\n📚 Testing reading sessions:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
    } else {
      console.log('✅ Reading sessions found:', sessions.length);
      sessions?.forEach(session => {
        console.log(
          `  ${session.date}: Surah ${session.surah_number}, Ayat ${session.ayat_start}-${session.ayat_end}`
        );
      });
    }

    // 6. Calculate expected streak
    console.log('\n🧮 Calculating expected streak:');

    if (checkinData && checkinData.length > 0) {
      let currentStreak = 0;
      let lastDate = null;

      const sortedCheckins = checkinData.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

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

      console.log('Expected current streak:', currentStreak, 'days');
      console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);

      // Compare with database
      if (streakData && streakData.length > 0) {
        const dbStreak = streakData[0];
        console.log('Database streak:', dbStreak.current, 'days');
        console.log('Match:', dbStreak.current === currentStreak ? '✅' : '❌');
      }
    }

    console.log('\n✅ All fixes test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Calendar should show user-specific data only');
    console.log('2. Home screen should show correct streak (7 days)');
    console.log('3. No VirtualizedList error in console');
    console.log('4. All data should be real-time synced');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllFixes();
