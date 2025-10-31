const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function forceRecalculateStreak() {
  console.log('🔄 Force Recalculating Streak...\n');

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return;
    }

    console.log('👤 Current user:', user.id);

    // Get all checkins for this user
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Checkins error:', checkinsError);
      return;
    }

    console.log('📅 Checkins data:', checkins);

    if (!checkins || checkins.length === 0) {
      console.log('❌ No checkins found');
      return;
    }

    // Manual streak calculation
    const sortedCheckins = [...checkins].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentStreak = 1;
    let longestStreak = 1;
    const lastDate = new Date(sortedCheckins[sortedCheckins.length - 1].date);

    console.log('📊 Calculating streak manually...');

    // Calculate consecutive days from the end
    for (let i = sortedCheckins.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedCheckins[i].date);
      const prevDate = new Date(sortedCheckins[i + 1].date);

      // Check if dates are consecutive
      const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

      console.log(
        `📅 Checking ${currentDate.toISOString().split('T')[0]} vs ${prevDate.toISOString().split('T')[0]}, diff: ${dayDiff} days`
      );

      if (dayDiff === 1) {
        currentStreak++;
        console.log(`✅ Consecutive! Streak now: ${currentStreak}`);
      } else {
        // Streak broken, check if this was the longest
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        console.log(`❌ Gap detected! Resetting streak from ${currentStreak} to 1`);
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

    console.log('🎯 Calculated streak:', calculatedStreak);

    // Update streaks table directly
    const { data: upsertResult, error: upsertError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: user.id,
          current: calculatedStreak.current,
          longest: calculatedStreak.longest,
          last_date: calculatedStreak.last_date,
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (upsertError) {
      console.error('❌ Upsert error:', upsertError);
      return;
    }

    console.log('✅ Streak updated successfully:', upsertResult);

    // Verify the update
    const { data: verifyStreak, error: verifyError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Verify error:', verifyError);
    } else {
      console.log('🔍 Verified streak data:', verifyStreak);
    }
  } catch (error) {
    console.error('❌ Force recalculate failed:', error);
  }
}

// Run the force recalculate
forceRecalculateStreak();
