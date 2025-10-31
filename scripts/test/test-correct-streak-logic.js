const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testCorrectStreakLogic() {
  console.log('🧪 Testing Correct Streak Logic...\n');

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

    // Clear existing data for clean test
    console.log('\n🧹 Clearing existing test data...');
    await supabase.from('streaks').delete().eq('user_id', user.id);
    await supabase.from('checkins').delete().eq('user_id', user.id);

    // Test Scenario 1: First day reading
    console.log('\n📅 Scenario 1: First day reading (21 Oct)');
    console.log('Expected: Streak 1🔥');

    const { data: checkin1, error: error1 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: user.id,
          date: '2024-10-21',
          ayat_count: 5,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error1) {
      console.error('❌ Error creating first checkin:', error1);
      return;
    }

    // Call streak update
    const { error: streakError1 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-21',
    });

    if (streakError1) {
      console.error('❌ Error updating streak:', streakError1);
      return;
    }

    // Check streak
    const { data: streak1 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ First day streak:', streak1?.current || 0);
    console.log('Expected: 1, Actual:', streak1?.current || 0);

    // Test Scenario 2: Consecutive day (22 Oct)
    console.log('\n📅 Scenario 2: Consecutive day (22 Oct)');
    console.log('Expected: Streak 2🔥');

    const { data: checkin2, error: error2 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: user.id,
          date: '2024-10-22',
          ayat_count: 3,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error2) {
      console.error('❌ Error creating second checkin:', error2);
      return;
    }

    const { error: streakError2 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-22',
    });

    if (streakError2) {
      console.error('❌ Error updating streak:', streakError2);
      return;
    }

    const { data: streak2 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ Second day streak:', streak2?.current || 0);
    console.log('Expected: 2, Actual:', streak2?.current || 0);

    // Test Scenario 3: Consecutive day (23 Oct)
    console.log('\n📅 Scenario 3: Consecutive day (23 Oct)');
    console.log('Expected: Streak 3🔥');

    const { data: checkin3, error: error3 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: user.id,
          date: '2024-10-23',
          ayat_count: 4,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error3) {
      console.error('❌ Error creating third checkin:', error3);
      return;
    }

    const { error: streakError3 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-23',
    });

    if (streakError3) {
      console.error('❌ Error updating streak:', streakError3);
      return;
    }

    const { data: streak3 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ Third day streak:', streak3?.current || 0);
    console.log('Expected: 3, Actual:', streak3?.current || 0);

    // Test Scenario 4: Missed day (24 Oct) - Streak should reset to 0
    console.log('\n📅 Scenario 4: Missed day (24 Oct) - No checkin');
    console.log('Expected: Streak 0🔥 (because no checkin on 24 Oct)');

    // Simulate missing 24 Oct by not creating checkin
    // Check streak after missing day
    const { data: streak4 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ After missed day streak:', streak4?.current || 0);
    console.log('Expected: 0, Actual:', streak4?.current || 0);

    // Test Scenario 5: Reading after missed day (25 Oct)
    console.log('\n📅 Scenario 5: Reading after missed day (25 Oct)');
    console.log('Expected: Streak 1🔥 (starts from 1 after gap)');

    const { data: checkin5, error: error5 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: user.id,
          date: '2024-10-25',
          ayat_count: 6,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error5) {
      console.error('❌ Error creating fifth checkin:', error5);
      return;
    }

    const { error: streakError5 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-25',
    });

    if (streakError5) {
      console.error('❌ Error updating streak:', streakError5);
      return;
    }

    const { data: streak5 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ After gap streak:', streak5?.current || 0);
    console.log('Expected: 1, Actual:', streak5?.current || 0);

    // Test Scenario 6: Consecutive day after gap (26 Oct)
    console.log('\n📅 Scenario 6: Consecutive day after gap (26 Oct)');
    console.log('Expected: Streak 2🔥');

    const { data: checkin6, error: error6 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: user.id,
          date: '2024-10-26',
          ayat_count: 7,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error6) {
      console.error('❌ Error creating sixth checkin:', error6);
      return;
    }

    const { error: streakError6 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-26',
    });

    if (streakError6) {
      console.error('❌ Error updating streak:', streakError6);
      return;
    }

    const { data: streak6 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ Consecutive after gap streak:', streak6?.current || 0);
    console.log('Expected: 2, Actual:', streak6?.current || 0);

    console.log('\n📊 Final Results:');
    console.log('Expected: 21 Oct = 1, 22 Oct = 2, 23 Oct = 3, 24 Oct = 0, 25 Oct = 1, 26 Oct = 2');
    console.log('Actual streak:', streak6?.current || 0);
    console.log('Longest streak:', streak6?.longest || 0);
    console.log('Last date:', streak6?.last_date);

    // Summary
    console.log('\n🎯 Test Summary:');
    console.log('✅ First day (21 Oct):', streak1?.current || 0, '(Expected: 1)');
    console.log('✅ Consecutive day 1 (22 Oct):', streak2?.current || 0, '(Expected: 2)');
    console.log('✅ Consecutive day 2 (23 Oct):', streak3?.current || 0, '(Expected: 3)');
    console.log('✅ After missed day (24 Oct):', streak4?.current || 0, '(Expected: 0)');
    console.log('✅ After gap (25 Oct):', streak5?.current || 0, '(Expected: 1)');
    console.log('✅ Consecutive after gap (26 Oct):', streak6?.current || 0, '(Expected: 2)');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCorrectStreakLogic();
