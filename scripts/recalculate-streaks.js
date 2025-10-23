const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateAllStreaks() {
  console.log('🔄 RECALCULATING ALL STREAKS...\n');

  try {
    // Get all users with checkins
    console.log('1️⃣ Getting users with checkins...');

    const { data: users } = await supabase.auth.admin.listUsers();
    let usersWithData = [];

    for (const user of users.users) {
      const { data: checkins } = await supabase
        .from('checkins')
        .select('date')
        .eq('user_id', user.id)
        .limit(1);

      if (checkins && checkins.length > 0) {
        usersWithData.push(user);
      }
    }

    console.log(`✅ Found ${usersWithData.length} users with checkins`);

    // Recalculate streaks for each user
    for (const user of usersWithData) {
      console.log(`\n👤 Recalculating streak for: ${user.email}`);

      // Get all checkin dates for this user
      const { data: checkins } = await supabase
        .from('checkins')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!checkins || checkins.length === 0) continue;

      const checkinDates = checkins.map(c => c.date).sort();
      console.log(`📅 Checkin dates: ${checkinDates.join(', ')}`);

      // Calculate consecutive days - start from day 1
      let consecutiveDays = 1; // First day always counts as streak 1
      let maxStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < checkinDates.length; i++) {
        const currentDate = new Date(checkinDates[i]);
        const prevDate = new Date(checkinDates[i - 1]);
        const daysDiff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Gap found, check if this was the longest streak
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
          currentStreak = 1; // Reset streak
        }
      }

      // Check if the final streak is the longest
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      // The current streak is the most recent consecutive days
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const lastCheckinDate = checkinDates[checkinDates.length - 1];
      if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
        consecutiveDays = currentStreak;
      } else {
        consecutiveDays = 0; // Streak broken
      }

      console.log(
        `📊 Calculated: ${consecutiveDays} current, ${maxStreak} longest`
      );

      // Update or insert streak record
      const { error: upsertError } = await supabase.from('streaks').upsert(
        {
          user_id: user.id,
          current: consecutiveDays,
          longest: maxStreak,
          last_date: lastCheckinDate,
        },
        { onConflict: 'user_id' }
      );

      if (upsertError) {
        console.log(`❌ Error updating streak: ${upsertError.message}`);
      } else {
        console.log(`✅ Streak updated successfully`);
      }
    }

    console.log('\n🎉 ALL STREAKS RECALCULATED!');
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
  }
}

recalculateAllStreaks();
