const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testRPCFunction() {
  console.log('🧪 Testing RPC Function...\n');

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

    // Get checkins data
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

    if (!checkins || checkins.length === 0) {
      console.log('❌ No checkins found');
      return;
    }

    // Test RPC function for each checkin date
    for (const checkin of checkins) {
      console.log(`\n🧪 Testing RPC for date: ${checkin.date}`);

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'update_streak_after_checkin',
        {
          checkin_date: checkin.date,
        }
      );

      if (rpcError) {
        console.error(`❌ RPC error for ${checkin.date}:`, rpcError);
      } else {
        console.log(`✅ RPC success for ${checkin.date}:`, rpcResult);
      }

      // Check streaks after each RPC call
      const { data: streaks, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

      if (streaksError) {
        console.error('❌ Streaks error:', streaksError);
      } else {
        console.log('⚡ Current streaks:', streaks);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRPCFunction();
