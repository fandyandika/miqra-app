const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProgressScreenData() {
  console.log('📊 TESTING PROGRESS SCREEN DATA...\n');

  try {
    // Get test1 user
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');

    if (!test1User) {
      console.log('❌ test1@miqra.com not found');
      return;
    }

    console.log(`👤 Testing with user: ${test1User.email}`);

    // Test current month data
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    console.log(`📅 Current month range: ${startStr} to ${endStr}`);

    // Get sessions for current month
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count, surah_number')
      .eq('user_id', test1User.id)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });

    console.log(`📚 Reading sessions: ${sessions?.length || 0}`);
    if (sessions && sessions.length > 0) {
      console.log('📅 Session dates:', [...new Set(sessions.map((s) => s.date))].sort());
    }

    // Get checkins for current month
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });

    console.log(`📊 Checkins: ${checkins?.length || 0}`);
    if (checkins && checkins.length > 0) {
      console.log('📅 Checkin dates:', [...new Set(checkins.map((c) => c.date))].sort());
    }

    // Calculate reading days (same logic as getReadingStats)
    const dateGroups = (sessions || []).reduce((acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + 1;
      return acc;
    }, {});

    // Add checkin dates to ensure we count all reading days
    (checkins || []).forEach((c) => {
      if (!dateGroups[c.date]) {
        dateGroups[c.date] = 1; // Count as 1 reading day even if no sessions
      }
    });

    const daysRead = Object.keys(dateGroups).length;
    const totalAyat = (sessions || []).reduce((sum, s) => sum + (s.ayat_count || 0), 0);
    const avgPerDay = daysRead > 0 ? Math.round(totalAyat / daysRead) : 0;

    console.log('\n📊 CALCULATED STATS:');
    console.log(`  Total Ayat: ${totalAyat}`);
    console.log(`  Days Read: ${daysRead}`);
    console.log(`  Average/Day: ${avgPerDay}`);
    console.log(`  Reading dates: ${Object.keys(dateGroups).sort().join(', ')}`);

    // Test with different timezones
    console.log('\n🌍 TESTING WITH DIFFERENT TIMEZONES:');

    const timezones = ['Asia/Jakarta', 'Asia/Makassar', 'UTC'];

    for (const tz of timezones) {
      const { toZonedTime } = require('date-fns-tz');
      const { format } = require('date-fns');

      const nowTz = new Date();
      const userNow = toZonedTime(nowTz, tz);
      const todayStr = format(userNow, 'yyyy-MM-dd');

      console.log(`  ${tz}: Today = ${todayStr}`);

      // Check if user has data for today in this timezone
      const todaySessions = sessions?.filter((s) => s.date === todayStr) || [];
      const todayCheckins = checkins?.filter((c) => c.date === todayStr) || [];

      console.log(`    Sessions today: ${todaySessions.length}`);
      console.log(`    Checkins today: ${todayCheckins.length}`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`Reading days: ${daysRead}`);
    console.log(`Total ayat: ${totalAyat}`);
    console.log(`Average/day: ${avgPerDay}`);
    console.log('✅ Data should now be timezone-aware');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProgressScreenData();
