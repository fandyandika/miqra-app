const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReadingDaysConsistency() {
  console.log('🔍 DEBUGGING READING DAYS CONSISTENCY...\n');

  try {
    // Get all users
    console.log('1️⃣ Getting all users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log('❌ Users error:', usersError.message);
      return;
    }

    if (!users || !users.users || users.users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    console.log(`✅ Found ${users.users.length} users`);

    // Test with first user
    const testUser = users.users[0];
    console.log(`👤 Testing with user: ${testUser.email} (${testUser.id})`);

    // Get checkins for this user
    console.log('\n2️⃣ Getting checkins data...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', testUser.id)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.log('❌ Checkins error:', checkinsError.message);
      return;
    }

    console.log(`✅ Found ${checkins.length} checkins`);
    if (checkins.length > 0) {
      console.log('📊 Recent checkins:', checkins.slice(0, 5));
    }

    // Get reading sessions for this user
    console.log('\n3️⃣ Getting reading sessions data...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count')
      .eq('user_id', testUser.id)
      .order('date', { ascending: false });

    if (sessionsError) {
      console.log('❌ Sessions error:', sessionsError.message);
      return;
    }

    console.log(`✅ Found ${sessions.length} reading sessions`);
    if (sessions.length > 0) {
      console.log('📊 Recent sessions:', sessions.slice(0, 5));
    }

    // Get streak data
    console.log('\n4️⃣ Getting streak data...');
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', testUser.id)
      .maybeSingle();

    if (streakError) {
      console.log('❌ Streak error:', streakError.message);
    } else {
      console.log('✅ Streak data:', streak);
    }

    // Calculate days read from checkins
    console.log('\n5️⃣ Calculating days read from checkins...');
    const checkinDates = [...new Set(checkins.map((c) => c.date))];
    const checkinDaysRead = checkinDates.length;
    console.log(`📅 Days with checkins: ${checkinDaysRead}`);
    console.log('📅 Checkin dates:', checkinDates.slice(0, 10));

    // Calculate days read from sessions
    console.log('\n6️⃣ Calculating days read from sessions...');
    const sessionDates = [...new Set(sessions.map((s) => s.date))];
    const sessionDaysRead = sessionDates.length;
    console.log(`📅 Days with sessions: ${sessionDaysRead}`);
    console.log('📅 Session dates:', sessionDates.slice(0, 10));

    // Check for inconsistencies
    console.log('\n7️⃣ Checking for inconsistencies...');

    if (checkinDaysRead !== sessionDaysRead) {
      console.log('❌ INCONSISTENCY FOUND!');
      console.log(`   Checkins days: ${checkinDaysRead}`);
      console.log(`   Sessions days: ${sessionDaysRead}`);

      // Find dates that are in one but not the other
      const checkinOnly = checkinDates.filter((d) => !sessionDates.includes(d));
      const sessionOnly = sessionDates.filter((d) => !checkinDates.includes(d));

      if (checkinOnly.length > 0) {
        console.log('   Dates in checkins but not sessions:', checkinOnly.slice(0, 5));
      }
      if (sessionOnly.length > 0) {
        console.log('   Dates in sessions but not checkins:', sessionOnly.slice(0, 5));
      }
    } else {
      console.log('✅ Days read count is consistent between checkins and sessions');
    }

    // Check streak consistency
    console.log('\n8️⃣ Checking streak consistency...');

    if (checkins.length > 0) {
      // Calculate actual consecutive days from checkins
      const sortedDates = checkinDates.sort();
      let consecutiveDays = 0;
      let currentStreak = 0;
      let maxStreak = 0;

      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

        if (!prevDate || currentDate.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }

        maxStreak = Math.max(maxStreak, currentStreak);

        // Check if this is the most recent date
        if (i === sortedDates.length - 1) {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          const lastCheckinDate = new Date(sortedDates[i]);
          const isToday = lastCheckinDate.toDateString() === today.toDateString();
          const isYesterday = lastCheckinDate.toDateString() === yesterday.toDateString();

          if (isToday || isYesterday) {
            consecutiveDays = currentStreak;
          } else {
            consecutiveDays = 0; // Streak broken
          }
        }
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

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`Checkins: ${checkins.length} records, ${checkinDaysRead} unique days`);
    console.log(`Sessions: ${sessions.length} records, ${sessionDaysRead} unique days`);
    console.log(`Streak: ${streak?.current || 0} current, ${streak?.longest || 0} longest`);

    if (checkinDaysRead === sessionDaysRead) {
      console.log('✅ Days read calculation is consistent');
    } else {
      console.log(
        '❌ Days read calculation is inconsistent - this explains the Progress page issue'
      );
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugReadingDaysConsistency();
