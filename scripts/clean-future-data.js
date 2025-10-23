const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanFutureData() {
  console.log('🧹 CLEANING FUTURE DATA...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);

    // 1. Find and delete future checkins
    console.log('\n1️⃣ CLEANING FUTURE CHECKINS...');

    const { data: futureCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('user_id, date, ayat_count')
      .gt('date', today);

    if (checkinsError) {
      console.log('❌ Error fetching future checkins:', checkinsError.message);
    } else {
      console.log(`📊 Found ${futureCheckins?.length || 0} future checkins`);

      if (futureCheckins && futureCheckins.length > 0) {
        console.log('🗑️ Future checkins to delete:');
        futureCheckins.forEach((checkin, index) => {
          console.log(
            `  ${index + 1}. User: ${checkin.user_id}, Date: ${checkin.date}, Ayat: ${checkin.ayat_count}`
          );
        });

        const { error: deleteCheckinsError } = await supabase
          .from('checkins')
          .delete()
          .gt('date', today);

        if (deleteCheckinsError) {
          console.log('❌ Error deleting future checkins:', deleteCheckinsError.message);
        } else {
          console.log('✅ Future checkins deleted successfully');
        }
      } else {
        console.log('✅ No future checkins found');
      }
    }

    // 2. Find and delete future reading sessions
    console.log('\n2️⃣ CLEANING FUTURE READING SESSIONS...');

    const { data: futureSessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('user_id, date, surah_number, ayat_start, ayat_end')
      .gt('date', today);

    if (sessionsError) {
      console.log('❌ Error fetching future sessions:', sessionsError.message);
    } else {
      console.log(`📊 Found ${futureSessions?.length || 0} future reading sessions`);

      if (futureSessions && futureSessions.length > 0) {
        console.log('🗑️ Future reading sessions to delete:');
        futureSessions.forEach((session, index) => {
          console.log(
            `  ${index + 1}. User: ${session.user_id}, Date: ${session.date}, Surah: ${session.surah_number}, Ayat: ${session.ayat_start}-${session.ayat_end}`
          );
        });

        const { error: deleteSessionsError } = await supabase
          .from('reading_sessions')
          .delete()
          .gt('date', today);

        if (deleteSessionsError) {
          console.log('❌ Error deleting future sessions:', deleteSessionsError.message);
        } else {
          console.log('✅ Future reading sessions deleted successfully');
        }
      } else {
        console.log('✅ No future reading sessions found');
      }
    }

    // 3. Recalculate streaks for all users after cleanup
    console.log('\n3️⃣ RECALCULATING STREAKS AFTER CLEANUP...');

    const { data: users } = await supabase.auth.admin.listUsers();
    const usersWithCheckins = new Set();

    // Get all users who have checkins
    const { data: allCheckins } = await supabase.from('checkins').select('user_id');

    if (allCheckins) {
      allCheckins.forEach((checkin) => usersWithCheckins.add(checkin.user_id));
    }

    console.log(`👥 Found ${usersWithCheckins.size} users with checkins`);

    for (const userId of usersWithCheckins) {
      console.log(`\n🔄 Recalculating streak for user: ${userId}`);

      // Get all checkins for this user
      const { data: userCheckins } = await supabase
        .from('checkins')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (!userCheckins || userCheckins.length === 0) {
        console.log('  ⚠️ No checkins found for user');
        continue;
      }

      const checkinDates = userCheckins.map((c) => c.date).sort();
      console.log(`  📅 Checkin dates: ${checkinDates.join(', ')}`);

      // Calculate streak
      let maxStreak = 0;
      let currentStreak = 0;

      // Find all possible consecutive sequences
      for (let i = 0; i < checkinDates.length; i++) {
        let tempStreak = 1;

        // Check consecutive days from this point forward
        for (let j = i + 1; j < checkinDates.length; j++) {
          const currentDate = new Date(checkinDates[j]);
          const prevDate = new Date(checkinDates[j - 1]);
          const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff === 1) {
            tempStreak++;
          } else {
            break; // Not consecutive, stop checking
          }
        }

        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      }

      // Find current active streak (consecutive days ending with the most recent checkin)
      const lastCheckinDate = checkinDates[checkinDates.length - 1];

      // Check if the most recent checkin is today or yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
        // Find consecutive days ending with the last checkin
        currentStreak = 1;

        for (let i = checkinDates.length - 2; i >= 0; i--) {
          const currentDate = new Date(checkinDates[i + 1]);
          const prevDate = new Date(checkinDates[i]);
          const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            break; // Not consecutive
          }
        }
      }

      console.log(`  📊 Calculated: ${currentStreak} current, ${maxStreak} longest`);

      // Update streak in database
      const { error: updateError } = await supabase.from('streaks').upsert(
        {
          user_id: userId,
          current: currentStreak,
          longest: maxStreak,
          last_date: lastCheckinDate,
        },
        { onConflict: 'user_id' }
      );

      if (updateError) {
        console.log(`  ❌ Error updating streak: ${updateError.message}`);
      } else {
        console.log(`  ✅ Streak updated successfully`);
      }
    }

    // 4. Final verification
    console.log('\n4️⃣ FINAL VERIFICATION...');

    const { data: remainingFutureCheckins } = await supabase
      .from('checkins')
      .select('user_id, date')
      .gt('date', today);

    const { data: remainingFutureSessions } = await supabase
      .from('reading_sessions')
      .select('user_id, date')
      .gt('date', today);

    console.log(`📊 Remaining future checkins: ${remainingFutureCheckins?.length || 0}`);
    console.log(`📊 Remaining future sessions: ${remainingFutureSessions?.length || 0}`);

    if (
      (remainingFutureCheckins?.length || 0) === 0 &&
      (remainingFutureSessions?.length || 0) === 0
    ) {
      console.log('✅ All future data cleaned successfully!');
    } else {
      console.log('⚠️ Some future data may still remain');
    }

    console.log('\n🎉 CLEANUP COMPLETED!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanFutureData();
