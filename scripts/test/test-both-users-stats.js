const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReadingStatsForBothUsers() {
  console.log('🧪 TESTING getReadingStats FOR BOTH USERS...\n');

  try {
    // Get both users
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');
    const test2User = users.users.find((u) => u.email === 'test2@miqra.com');

    if (!test1User || !test2User) {
      console.log('❌ One or both test users not found');
      return;
    }

    // Test getReadingStats for test1
    console.log('1️⃣ TESTING TEST1 USER...');
    console.log(`👤 User: ${test1User.email}`);

    // Simulate getReadingStats for current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log(`📅 Date range: ${start} to ${end}`);

    // Get sessions for test1
    const { data: test1Sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count, surah_number')
      .eq('user_id', test1User.id)
      .gte('date', start)
      .lte('date', end);

    // Get checkins for test1
    const { data: test1Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .gte('date', start)
      .lte('date', end);

    console.log(`📊 Sessions: ${test1Sessions?.length || 0}`);
    console.log(`📊 Checkins: ${test1Checkins?.length || 0}`);

    // Simulate the fixed getReadingStats logic
    const totalAyat1 = (test1Sessions || []).reduce((sum, s) => sum + (s.ayat_count || 0), 0);
    const totalSessions1 = (test1Sessions || []).length;

    // Group by date to count unique reading days from BOTH sessions and checkins
    const dateGroups1 = (test1Sessions || []).reduce((acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + 1;
      return acc;
    }, {});

    // Add checkin dates to ensure we count all reading days
    (test1Checkins || []).forEach((c) => {
      if (!dateGroups1[c.date]) {
        dateGroups1[c.date] = 1; // Count as 1 reading day even if no sessions
      }
    });

    const daysRead1 = Object.keys(dateGroups1).length;
    const avgPerDay1 = daysRead1 > 0 ? Math.round(totalAyat1 / daysRead1) : 0;

    console.log(
      `📊 Test1 Results: ${totalAyat1} ayat, ${daysRead1} days read, ${avgPerDay1} avg/day`
    );
    console.log(`📅 Test1 reading dates: ${Object.keys(dateGroups1).sort().join(', ')}`);

    // Test getReadingStats for test2
    console.log('\n2️⃣ TESTING TEST2 USER...');
    console.log(`👤 User: ${test2User.email}`);

    // Get sessions for test2
    const { data: test2Sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count, surah_number')
      .eq('user_id', test2User.id)
      .gte('date', start)
      .lte('date', end);

    // Get checkins for test2
    const { data: test2Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test2User.id)
      .gte('date', start)
      .lte('date', end);

    console.log(`📊 Sessions: ${test2Sessions?.length || 0}`);
    console.log(`📊 Checkins: ${test2Checkins?.length || 0}`);

    // Simulate the fixed getReadingStats logic
    const totalAyat2 = (test2Sessions || []).reduce((sum, s) => sum + (s.ayat_count || 0), 0);
    const totalSessions2 = (test2Sessions || []).length;

    // Group by date to count unique reading days from BOTH sessions and checkins
    const dateGroups2 = (test2Sessions || []).reduce((acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + 1;
      return acc;
    }, {});

    // Add checkin dates to ensure we count all reading days
    (test2Checkins || []).forEach((c) => {
      if (!dateGroups2[c.date]) {
        dateGroups2[c.date] = 1; // Count as 1 reading day even if no sessions
      }
    });

    const daysRead2 = Object.keys(dateGroups2).length;
    const avgPerDay2 = daysRead2 > 0 ? Math.round(totalAyat2 / daysRead2) : 0;

    console.log(
      `📊 Test2 Results: ${totalAyat2} ayat, ${daysRead2} days read, ${avgPerDay2} avg/day`
    );
    console.log(`📅 Test2 reading dates: ${Object.keys(dateGroups2).sort().join(', ')}`);

    // Get current streaks
    console.log('\n3️⃣ CURRENT STREAKS...');

    const { data: test1Streak } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test1User.id)
      .single();

    const { data: test2Streak } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test2User.id)
      .single();

    console.log(
      `📊 Test1 streak: ${test1Streak?.current || 0} current, ${test1Streak?.longest || 0} longest`
    );
    console.log(
      `📊 Test2 streak: ${test2Streak?.current || 0} current, ${test2Streak?.longest || 0} longest`
    );

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`Test1: ${daysRead1} reading days, ${test1Streak?.current || 0} streak`);
    console.log(`Test2: ${daysRead2} reading days, ${test2Streak?.current || 0} streak`);

    // Check what the user is seeing
    console.log('\n📱 WHAT USER SEES IN APP:');
    console.log('========================');
    console.log(`Test1 Progress page: "Hari Membaca" = ${daysRead1} (should be 6)`);
    console.log(`Test1 Home/Profile: "Streak" = ${test1Streak?.current || 0} (should be 0)`);
    console.log(`Test2 Progress page: "Hari Membaca" = ${daysRead2} (should be 4)`);
    console.log(`Test2 Home/Profile: "Streak" = ${test2Streak?.current || 0} (should be 1)`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReadingStatsForBothUsers();
