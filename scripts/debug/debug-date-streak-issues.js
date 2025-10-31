const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDateAndStreakIssues() {
  console.log('🔍 DEBUGGING DATE VALIDATION AND STREAK ISSUES...\n');

  try {
    // Get current date info
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log('📅 DATE INFO:');
    console.log(`Today: ${todayStr}`);
    console.log(`Yesterday: ${yesterdayStr}`);
    console.log(`Tomorrow: ${tomorrowStr}`);

    // Get both users
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');
    const test2User = users.users.find((u) => u.email === 'test2@miqra.com');

    if (!test1User || !test2User) {
      console.log('❌ One or both test users not found');
      return;
    }

    console.log('\n1️⃣ ANALYZING TEST1 USER (should not have future dates)...');
    console.log(`👤 User: ${test1User.email}`);

    const { data: test1Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count, created_at')
      .eq('user_id', test1User.id)
      .order('date', { ascending: true });

    console.log(`📊 Found ${test1Checkins.length} checkins`);
    test1Checkins.forEach((checkin, index) => {
      const isFuture = checkin.date > todayStr;
      const isToday = checkin.date === todayStr;
      const isPast = checkin.date < todayStr;
      console.log(
        `  ${index + 1}. ${checkin.date} (${checkin.ayat_count} ayat) - ${isFuture ? '❌ FUTURE' : isToday ? '✅ TODAY' : '✅ PAST'}`
      );
    });

    // Check for future dates
    const futureCheckins = test1Checkins.filter((c) => c.date > todayStr);
    if (futureCheckins.length > 0) {
      console.log(`❌ PROBLEM: Test1 has ${futureCheckins.length} future checkins!`);
      console.log('💡 This should not be allowed - users cannot input future dates');
    } else {
      console.log('✅ Test1 has no future checkins');
    }

    console.log('\n2️⃣ ANALYZING TEST2 USER (streak should be 3)...');
    console.log(`👤 User: ${test2User.email}`);

    const { data: test2Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count, created_at')
      .eq('user_id', test2User.id)
      .order('date', { ascending: true });

    console.log(`📊 Found ${test2Checkins.length} checkins`);
    test2Checkins.forEach((checkin, index) => {
      const isFuture = checkin.date > todayStr;
      const isToday = checkin.date === todayStr;
      const isPast = checkin.date < todayStr;
      console.log(
        `  ${index + 1}. ${checkin.date} (${checkin.ayat_count} ayat) - ${isFuture ? '❌ FUTURE' : isToday ? '✅ TODAY' : '✅ PAST'}`
      );
    });

    // Calculate streak manually for test2
    console.log('\n3️⃣ CALCULATING TEST2 STREAK MANUALLY...');

    const test2Dates = test2Checkins.map((c) => c.date).sort();
    console.log('📅 Test2 checkin dates:', test2Dates);

    // Find consecutive days from the end
    let consecutiveDays = 0;
    let currentStreak = 1;
    let maxStreak = 1;

    // Start from the most recent date and work backwards
    for (let i = test2Dates.length - 1; i >= 0; i--) {
      const currentDate = new Date(test2Dates[i]);
      const prevDate = i > 0 ? new Date(test2Dates[i - 1]) : null;

      if (prevDate) {
        const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        console.log(`📅 ${test2Dates[i]} vs ${test2Dates[i - 1]}: ${daysDiff} days diff`);

        if (daysDiff === 1) {
          currentStreak++;
          console.log(`  → Consecutive! Current streak: ${currentStreak}`);
        } else {
          console.log(`  → Gap found! Streak broken. Max streak was: ${currentStreak}`);
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

    // Check if streak is still active
    const lastCheckinDate = test2Dates[test2Dates.length - 1];
    console.log(`📅 Last checkin: ${lastCheckinDate}`);
    console.log(`📅 Today: ${todayStr}`);
    console.log(`📅 Yesterday: ${yesterdayStr}`);

    if (lastCheckinDate === todayStr) {
      consecutiveDays = currentStreak;
      console.log(`✅ Last checkin was today - streak is active: ${consecutiveDays}`);
    } else if (lastCheckinDate === yesterdayStr) {
      consecutiveDays = currentStreak;
      console.log(`✅ Last checkin was yesterday - streak is active: ${consecutiveDays}`);
    } else {
      consecutiveDays = 0;
      console.log(
        `❌ Last checkin was not today or yesterday - streak is broken: ${consecutiveDays}`
      );
    }

    console.log(`📊 Calculated streak: ${consecutiveDays} current, ${maxStreak} longest`);

    // Get current database streak
    const { data: test2Streak } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test2User.id)
      .single();

    console.log(
      `📊 Database streak: ${test2Streak?.current || 0} current, ${test2Streak?.longest || 0} longest`
    );

    if (consecutiveDays !== (test2Streak?.current || 0)) {
      console.log('❌ STREAK MISMATCH!');
      console.log(`   Calculated: ${consecutiveDays}`);
      console.log(`   Database: ${test2Streak?.current || 0}`);

      // Fix the streak
      console.log('\n🔧 FIXING TEST2 STREAK...');
      const { error: updateError } = await supabase.from('streaks').upsert(
        {
          user_id: test2User.id,
          current: consecutiveDays,
          longest: maxStreak,
          last_date: lastCheckinDate,
        },
        { onConflict: 'user_id' }
      );

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Streak fixed!');
      }
    } else {
      console.log('✅ Streak is correct');
    }

    // Check for future dates in test2
    const test2FutureCheckins = test2Checkins.filter((c) => c.date > todayStr);
    if (test2FutureCheckins.length > 0) {
      console.log(`❌ PROBLEM: Test2 has ${test2FutureCheckins.length} future checkins!`);
    } else {
      console.log('✅ Test2 has no future checkins');
    }

    console.log('\n4️⃣ SUMMARY:');
    console.log('============');
    console.log(`Test1 future checkins: ${futureCheckins.length} (should be 0)`);
    console.log(`Test2 future checkins: ${test2FutureCheckins.length} (should be 0)`);
    console.log(`Test2 streak: ${consecutiveDays} (should be 3 if last 3 days consecutive)`);
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDateAndStreakIssues();
