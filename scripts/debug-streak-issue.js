const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugStreakIssue() {
  console.log('🔍 Debugging Streak Issue...\n');

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

    // Check checkins data
    console.log('\n📊 Checking checkins data...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Checkins error:', checkinsError);
      return;
    }

    console.log('📅 Checkins data:', checkins);

    // Check streaks data
    console.log('\n🔥 Checking streaks data...');
    const { data: streaks, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id);

    if (streaksError) {
      console.error('❌ Streaks error:', streaksError);
      return;
    }

    console.log('⚡ Streaks data:', streaks);

    // Test RPC function
    if (checkins && checkins.length > 0) {
      console.log('\n🧪 Testing RPC function...');
      const lastCheckin = checkins[checkins.length - 1];
      console.log('📅 Last checkin date:', lastCheckin.date);

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'update_streak_after_checkin',
        {
          checkin_date: lastCheckin.date,
        }
      );

      if (rpcError) {
        console.error('❌ RPC error:', rpcError);
      } else {
        console.log('✅ RPC result:', rpcResult);
      }

      // Check streaks again after RPC
      console.log('\n🔄 Checking streaks after RPC...');
      const { data: streaksAfter, error: streaksAfterError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

      if (streaksAfterError) {
        console.error('❌ Streaks after RPC error:', streaksAfterError);
      } else {
        console.log('⚡ Streaks after RPC:', streaksAfter);
      }
    }

    // Test getCurrentStreak function
    console.log('\n🔧 Testing getCurrentStreak function...');
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (userId) {
      // Simulate getCurrentStreak logic
      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('date, ayat_count')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      console.log('📊 Raw checkins for getCurrentStreak:', checkinsData);

      const { data: streakData, error: streakError } = await supabase
        .from('streaks')
        .select('current, longest, last_date')
        .eq('user_id', userId)
        .maybeSingle();

      if (streakError) {
        console.error('❌ Streak fetch error:', streakError);
      } else {
        console.log('⚡ Streak data from getCurrentStreak:', streakData);
      }
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugStreakIssue();
