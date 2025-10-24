const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Simulate getCurrentStreak function
async function testGetCurrentStreak() {
  console.log('🧪 Testing getCurrentStreak function...\n');

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

    const userId = user.id;
    console.log('👤 Current user:', userId);

    // First, let's check the raw checkins data
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Checkins error:', checkinsError);
      return;
    }

    console.log('📊 Raw checkins data:', checkinsData);

    const { data, error } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('❌ Streak fetch error:', error);
      return;
    }

    const result = data || { current: 0, longest: 0, last_date: null };
    console.log('⚡ Streak table result:', result);

    // If we have checkins but no streak record or streak is 0, try to recalculate
    if (checkinsData && checkinsData.length >= 1 && (!data || result.current === 0)) {
      console.log('🔄 Attempting to recalculate streak...');
      console.log('📊 Checkins count:', checkinsData.length);
      console.log('📊 Has streak record:', !!data);
      console.log('📊 Current streak:', result.current);

      // Trigger streak recalculation for the most recent checkin
      const lastCheckin = checkinsData[checkinsData.length - 1];
      console.log('📅 Last checkin date:', lastCheckin.date);

      const { error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
        checkin_date: lastCheckin.date,
      });

      if (rpcError) {
        console.warn('❌ RPC error during recalculation:', rpcError);
        // If RPC fails, try manual calculation
        console.log('🔧 Attempting manual streak calculation...');
        const manualStreak = calculateStreakManually(checkinsData);
        console.log('✅ Manual calculation result:', manualStreak);
        return manualStreak;
      } else {
        console.log('✅ Streak recalculated, fetching updated data...');
        // Fetch updated streak data
        const { data: updatedData, error: updatedError } = await supabase
          .from('streaks')
          .select('current, longest, last_date')
          .eq('user_id', userId)
          .maybeSingle();

        if (updatedError) {
          console.error('❌ Error fetching updated data:', updatedError);
          return result;
        }

        if (updatedData) {
          console.log('✅ Updated streak data:', updatedData);
          return updatedData;
        } else {
          console.log('⚠️ No updated data found, returning original result');
          return result;
        }
      }
    }

    console.log('📤 Returning result:', result);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Manual streak calculation as fallback
function calculateStreakManually(checkinsData) {
  if (!checkinsData || checkinsData.length === 0) {
    return { current: 0, longest: 0, last_date: null };
  }

  // Sort by date
  const sortedCheckins = [...checkinsData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentStreak = 1; // First day always counts as streak 1
  let longestStreak = 1;
  const lastDate = new Date(sortedCheckins[sortedCheckins.length - 1].date);

  console.log('Starting calculation with', sortedCheckins.length, 'checkins');

  // Calculate consecutive days from the end
  for (let i = sortedCheckins.length - 2; i >= 0; i--) {
    const currentDate = new Date(sortedCheckins[i].date);
    const prevDate = new Date(sortedCheckins[i + 1].date);

    // Check if dates are consecutive
    const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    console.log(
      `Checking ${currentDate.toISOString().split('T')[0]} vs ${prevDate.toISOString().split('T')[0]}, diff: ${dayDiff} days`
    );

    if (dayDiff === 1) {
      currentStreak++;
      console.log(`Consecutive! Streak now: ${currentStreak}`);
    } else {
      // Streak broken, check if this was the longest
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      console.log(`Gap detected! Resetting streak from ${currentStreak} to 1`);
      currentStreak = 1;
    }
  }

  // Check if the final streak is the longest
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const result = {
    current: currentStreak,
    longest: longestStreak,
    last_date: lastDate.toISOString().split('T')[0],
  };

  console.log('Final result:', result);
  return result;
}

// Run the test
testGetCurrentStreak();
