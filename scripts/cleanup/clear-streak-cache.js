const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function clearStreakCache() {
  console.log('🧹 Clearing Streak Cache...\n');

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

    // Check current checkins
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Checkins error:', checkinsError);
      return;
    }

    console.log('📅 Current checkins:', checkins);

    // Check current streaks
    const { data: streaks, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id);

    if (streaksError) {
      console.error('❌ Streaks error:', streaksError);
      return;
    }

    console.log('⚡ Current streaks:', streaks);

    // Force recalculate streak for each checkin date
    if (checkins && checkins.length > 0) {
      console.log('\n🔄 Force recalculating streak for all checkin dates...');

      for (const checkin of checkins) {
        console.log(`📅 Recalculating for date: ${checkin.date}`);

        const { error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
          checkin_date: checkin.date,
        });

        if (rpcError) {
          console.error(`❌ RPC error for ${checkin.date}:`, rpcError);
        } else {
          console.log(`✅ RPC success for ${checkin.date}`);
        }
      }

      // Check streaks after recalculation
      console.log('\n🔍 Checking streaks after recalculation...');
      const { data: streaksAfter, error: streaksAfterError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

      if (streaksAfterError) {
        console.error('❌ Streaks after recalculation error:', streaksAfterError);
      } else {
        console.log('⚡ Streaks after recalculation:', streaksAfter);
      }
    }
  } catch (error) {
    console.error('❌ Clear cache failed:', error);
  }
}

// Run the clear cache
clearStreakCache();
