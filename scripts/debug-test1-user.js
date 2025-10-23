const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTest1User() {
  console.log('🔍 DEBUGGING TEST1 USER DATA...\n');

  try {
    // Find test1 user
    console.log('1️⃣ Finding test1 user...');

    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find(u => u.email === 'test1@miqra.com');

    if (!test1User) {
      console.log('❌ test1@miqra.com not found');
      return;
    }

    console.log(`✅ Found test1 user: ${test1User.email} (${test1User.id})`);

    // Get checkins for test1
    console.log('\n2️⃣ Getting checkins data...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.log('❌ Checkins error:', checkinsError.message);
      return;
    }

    console.log(`✅ Found ${checkins.length} checkins`);
    console.log('📊 All checkins:', checkins);

    // Get reading sessions for test1
    console.log('\n3️⃣ Getting reading sessions data...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .order('date', { ascending: true });

    if (sessionsError) {
      console.log('❌ Sessions error:', sessionsError.message);
      return;
    }

    console.log(`✅ Found ${sessions.length} reading sessions`);
    console.log('📊 All sessions:', sessions);

    // Get streak data
    console.log('\n4️⃣ Getting streak data...');
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test1User.id)
      .maybeSingle();

    if (streakError) {
      console.log('❌ Streak error:', streakError.message);
    } else {
      console.log('✅ Streak data:', streak);
    }

    // Calculate days read from checkins
    console.log('\n5️⃣ Calculating days read from checkins...');
    const checkinDates = [...new Set(checkins.map(c => c.date))];
    const checkinDaysRead = checkinDates.length;
    console.log(`📅 Days with checkins: ${checkinDaysRead}`);
    console.log('📅 Checkin dates:', checkinDates);

    // Calculate days read from sessions
    console.log('\n6️⃣ Calculating days read from sessions...');
    const sessionDates = [...new Set(sessions.map(s => s.date))];
    const sessionDaysRead = sessionDates.length;
    console.log(`📅 Days with sessions: ${sessionDaysRead}`);
    console.log('📅 Session dates:', sessionDates);

    // Calculate combined reading days (as per fixed getReadingStats)
    console.log('\n7️⃣ Calculating combined reading days...');
    const allDates = [...new Set([...checkinDates, ...sessionDates])];
    const combinedDaysRead = allDates.length;
    console.log(`📅 Combined reading days: ${combinedDaysRead}`);
    console.log('📅 All reading dates:', allDates.sort());

    // Calculate streak manually
    console.log('\n8️⃣ Calculating streak manually...');

    if (checkinDates.length > 0) {
      const sortedDates = checkinDates.sort();
      console.log('📅 Sorted checkin dates:', sortedDates);

      let consecutiveDays = 0;
      let currentStreak = 1;
      let maxStreak = 1;

      // Calculate from the end (most recent)
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

        if (prevDate) {
          const daysDiff =
            (currentDate.getTime() - prevDate.getTime()) /
            (1000 * 60 * 60 * 24);
          console.log(
            `📅 ${sortedDates[i]} vs ${sortedDates[i - 1]}: ${daysDiff} days diff`
          );

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
      console.log(
        `📅 Last checkin: ${lastCheckinDate}, Today: ${today}, Yesterday: ${yesterdayStr}`
      );

      if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
        consecutiveDays = currentStreak;
      } else {
        consecutiveDays = 0; // Streak broken
      }

      console.log(`📊 Calculated consecutive days: ${consecutiveDays}`);
      console.log(`📊 Calculated max streak: ${maxStreak}`);
      console.log(`📊 Database streak current: ${streak?.current || 0}`);
      console.log(`📊 Database streak longest: ${streak?.longest || 0}`);

      if (consecutiveDays !== (streak?.current || 0)) {
        console.log('❌ STREAK INCONSISTENCY!');
        console.log(`   Calculated: ${consecutiveDays}`);
        console.log(`   Database: ${streak?.current || 0}`);
      } else {
        console.log('✅ Streak is consistent');
      }
    }

    // Check current month data
    console.log('\n9️⃣ Checking current month data...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    console.log(`📅 Current month range: ${startStr} to ${endStr}`);

    const monthCheckins = checkins.filter(
      c => c.date >= startStr && c.date <= endStr
    );
    const monthSessions = sessions.filter(
      s => s.date >= startStr && s.date <= endStr
    );

    console.log(`📊 Checkins this month: ${monthCheckins.length}`);
    console.log(`📊 Sessions this month: ${monthSessions.length}`);

    const monthCheckinDates = [...new Set(monthCheckins.map(c => c.date))];
    const monthSessionDates = [...new Set(monthSessions.map(s => s.date))];
    const monthAllDates = [
      ...new Set([...monthCheckinDates, ...monthSessionDates]),
    ];

    console.log(`📅 Checkin dates this month: ${monthCheckinDates.sort()}`);
    console.log(`📅 Session dates this month: ${monthSessionDates.sort()}`);
    console.log(`📅 Combined reading days this month: ${monthAllDates.length}`);
    console.log(`📅 All reading dates this month: ${monthAllDates.sort()}`);

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(
      `Total checkins: ${checkins.length} records, ${checkinDaysRead} unique days`
    );
    console.log(
      `Total sessions: ${sessions.length} records, ${sessionDaysRead} unique days`
    );
    console.log(`Combined reading days: ${combinedDaysRead}`);
    console.log(`Current month reading days: ${monthAllDates.length}`);
    console.log(
      `Streak: ${streak?.current || 0} current, ${streak?.longest || 0} longest`
    );
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTest1User();
