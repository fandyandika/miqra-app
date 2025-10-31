const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function compareTestUsers() {
  console.log('🔍 COMPARING TEST1 VS TEST2 USERS...\n');

  try {
    // Get both users
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');
    const test2User = users.users.find((u) => u.email === 'test2@miqra.com');

    if (!test1User || !test2User) {
      console.log('❌ One or both test users not found');
      return;
    }

    console.log(`👤 Test1: ${test1User.email} (${test1User.id})`);
    console.log(`👤 Test2: ${test2User.email} (${test2User.id})`);

    // Compare checkins
    console.log('\n1️⃣ COMPARING CHECKINS...');

    const { data: test1Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .order('date', { ascending: true });

    const { data: test2Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test2User.id)
      .order('date', { ascending: true });

    console.log(`📊 Test1 checkins: ${test1Checkins.length} records`);
    console.log(
      '📅 Test1 dates:',
      test1Checkins.map((c) => c.date)
    );
    console.log(`📊 Test2 checkins: ${test2Checkins.length} records`);
    console.log(
      '📅 Test2 dates:',
      test2Checkins.map((c) => c.date)
    );

    // Compare reading sessions
    console.log('\n2️⃣ COMPARING READING SESSIONS...');

    const { data: test1Sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .order('date', { ascending: true });

    const { data: test2Sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count')
      .eq('user_id', test2User.id)
      .order('date', { ascending: true });

    console.log(`📊 Test1 sessions: ${test1Sessions.length} records`);
    console.log('📅 Test1 session dates:', [...new Set(test1Sessions.map((s) => s.date))]);
    console.log(`📊 Test2 sessions: ${test2Sessions.length} records`);
    console.log('📅 Test2 session dates:', [...new Set(test2Sessions.map((s) => s.date))]);

    // Compare streaks
    console.log('\n3️⃣ COMPARING STREAKS...');

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

    console.log('📊 Test1 streak:', test1Streak);
    console.log('📊 Test2 streak:', test2Streak);

    // Calculate reading days for both users
    console.log('\n4️⃣ CALCULATING READING DAYS...');

    const test1CheckinDates = [...new Set(test1Checkins.map((c) => c.date))];
    const test1SessionDates = [...new Set(test1Sessions.map((s) => s.date))];
    const test1AllDates = [...new Set([...test1CheckinDates, ...test1SessionDates])];

    const test2CheckinDates = [...new Set(test2Checkins.map((c) => c.date))];
    const test2SessionDates = [...new Set(test2Sessions.map((s) => s.date))];
    const test2AllDates = [...new Set([...test2CheckinDates, ...test2SessionDates])];

    console.log(
      `📊 Test1 reading days: ${test1AllDates.length} (checkins: ${test1CheckinDates.length}, sessions: ${test1SessionDates.length})`
    );
    console.log(
      `📊 Test2 reading days: ${test2AllDates.length} (checkins: ${test2CheckinDates.length}, sessions: ${test2SessionDates.length})`
    );

    // Calculate streaks manually
    console.log('\n5️⃣ CALCULATING STREAKS MANUALLY...');

    const calculateStreak = (checkinDates) => {
      if (checkinDates.length === 0) return { current: 0, longest: 0 };

      const sortedDates = checkinDates.sort();
      let consecutiveDays = 0;
      let currentStreak = 1;
      let maxStreak = 1;

      // Calculate from the end (most recent)
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

        if (prevDate) {
          const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            if (currentStreak > maxStreak) {
              maxStreak = currentStreak;
            }
            currentStreak = 1;
          }
        }
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      // Check if streak is still active (today or yesterday)
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const lastCheckinDate = sortedDates[sortedDates.length - 1];

      if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
        consecutiveDays = currentStreak;
      } else {
        consecutiveDays = 0; // Streak broken
      }

      return {
        current: consecutiveDays,
        longest: maxStreak,
        last_date: lastCheckinDate,
      };
    };

    const test1Calculated = calculateStreak(test1CheckinDates);
    const test2Calculated = calculateStreak(test2CheckinDates);

    console.log('📊 Test1 calculated streak:', test1Calculated);
    console.log('📊 Test2 calculated streak:', test2Calculated);

    // Compare with database
    console.log('\n6️⃣ COMPARING WITH DATABASE...');

    console.log('Test1 - Database vs Calculated:');
    console.log(
      `  Database: ${test1Streak?.current || 0} current, ${test1Streak?.longest || 0} longest`
    );
    console.log(
      `  Calculated: ${test1Calculated.current} current, ${test1Calculated.longest} longest`
    );
    console.log(`  Match: ${test1Streak?.current === test1Calculated.current ? '✅' : '❌'}`);

    console.log('Test2 - Database vs Calculated:');
    console.log(
      `  Database: ${test2Streak?.current || 0} current, ${test2Streak?.longest || 0} longest`
    );
    console.log(
      `  Calculated: ${test2Calculated.current} current, ${test2Calculated.longest} longest`
    );
    console.log(`  Match: ${test2Streak?.current === test2Calculated.current ? '✅' : '❌'}`);

    // Check current month data
    console.log('\n7️⃣ CHECKING CURRENT MONTH DATA...');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    console.log(`📅 Current month range: ${startStr} to ${endStr}`);

    const test1MonthCheckins = test1Checkins.filter((c) => c.date >= startStr && c.date <= endStr);
    const test1MonthSessions = test1Sessions.filter((s) => s.date >= startStr && s.date <= endStr);
    const test1MonthAllDates = [
      ...new Set([
        ...test1MonthCheckins.map((c) => c.date),
        ...test1MonthSessions.map((s) => s.date),
      ]),
    ];

    const test2MonthCheckins = test2Checkins.filter((c) => c.date >= startStr && c.date <= endStr);
    const test2MonthSessions = test2Sessions.filter((s) => s.date >= startStr && s.date <= endStr);
    const test2MonthAllDates = [
      ...new Set([
        ...test2MonthCheckins.map((c) => c.date),
        ...test2MonthSessions.map((s) => s.date),
      ]),
    ];

    console.log(`📊 Test1 month reading days: ${test1MonthAllDates.length}`);
    console.log(`📊 Test2 month reading days: ${test2MonthAllDates.length}`);

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(
      `Test1: ${test1AllDates.length} total reading days, ${test1MonthAllDates.length} this month, streak ${test1Streak?.current || 0}`
    );
    console.log(
      `Test2: ${test2AllDates.length} total reading days, ${test2MonthAllDates.length} this month, streak ${test2Streak?.current || 0}`
    );
  } catch (error) {
    console.error('❌ Comparison failed:', error);
  }
}

compareTestUsers();
