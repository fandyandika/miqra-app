const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function forceRecalculateAllStreaks() {
  console.log('🔄 Force Recalculating All Streaks...\n');

  try {
    // Get all users with checkins
    const { data: users, error: usersError } = await supabase
      .from('checkins')
      .select('user_id')
      .order('user_id');

    if (usersError) {
      console.error('❌ Users error:', usersError);
      return;
    }

    // Get unique user IDs
    const uniqueUsers = [...new Set(users.map((u) => u.user_id))];
    console.log('👥 Found', uniqueUsers.length, 'users with checkins');

    for (const userId of uniqueUsers) {
      console.log(`\n👤 Processing user: ${userId}`);

      // Get checkins for this user
      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('date, ayat_count')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (checkinsError) {
        console.error(`❌ Checkins error for user ${userId}:`, checkinsError);
        continue;
      }

      console.log(`📅 Checkins for user ${userId}:`, checkins);

      if (!checkins || checkins.length === 0) {
        console.log(`⚠️ No checkins for user ${userId}`);
        continue;
      }

      // Manual streak calculation
      const sortedCheckins = [...checkins].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let currentStreak = 1;
      let longestStreak = 1;
      const lastDate = new Date(sortedCheckins[sortedCheckins.length - 1].date);

      console.log(`📊 Calculating streak for user ${userId}...`);

      // Calculate consecutive days from the end
      for (let i = sortedCheckins.length - 2; i >= 0; i--) {
        const currentDate = new Date(sortedCheckins[i].date);
        const prevDate = new Date(sortedCheckins[i + 1].date);

        // Check if dates are consecutive
        const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          // Streak broken, check if this was the longest
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          currentStreak = 1;
        }
      }

      // Check if the final streak is the longest
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      const calculatedStreak = {
        current: currentStreak,
        longest: longestStreak,
        last_date: lastDate.toISOString().split('T')[0],
      };

      console.log(`🎯 Calculated streak for user ${userId}:`, calculatedStreak);

      // Update streaks table directly
      const { data: upsertResult, error: upsertError } = await supabase
        .from('streaks')
        .upsert(
          {
            user_id: userId,
            current: calculatedStreak.current,
            longest: calculatedStreak.longest,
            last_date: calculatedStreak.last_date,
          },
          { onConflict: 'user_id' }
        )
        .select();

      if (upsertError) {
        console.error(`❌ Upsert error for user ${userId}:`, upsertError);
        continue;
      }

      console.log(`✅ Streak updated for user ${userId}:`, upsertResult);
    }

    console.log('\n🎉 All streaks recalculated successfully!');
  } catch (error) {
    console.error('❌ Force recalculate failed:', error);
  }
}

// Run the force recalculate
forceRecalculateAllStreaks();
