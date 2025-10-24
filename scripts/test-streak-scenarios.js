const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testStreakScenarios() {
  console.log('🧪 Testing Streak Scenarios...\n');

  try {
    // Test user ID (you can change this to your test user)
    const testUserId = 'your-test-user-id'; // Replace with actual test user ID

    console.log('📅 Scenario: First day reading');
    console.log('Expected: Streak 1🔥');

    // Simulate first day checkin
    const { data: checkin1, error: error1 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUserId,
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
      .eq('user_id', testUserId)
      .single();

    console.log('✅ First day streak:', streak1?.current || 0);

    console.log('\n📅 Scenario: Missed day (22 Oct)');
    console.log('Expected: Streak should reset to 0 or remain 1');

    // Simulate reading on 23 Oct (after missing 22 Oct)
    const { data: checkin2, error: error2 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUserId,
          date: '2024-10-23',
          ayat_count: 3,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error2) {
      console.error('❌ Error creating second checkin:', error2);
      return;
    }

    // Call streak update
    const { error: streakError2 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-23',
    });

    if (streakError2) {
      console.error('❌ Error updating streak:', streakError2);
      return;
    }

    // Check streak
    const { data: streak2 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    console.log('✅ After missed day streak:', streak2?.current || 0);

    console.log('\n📅 Scenario: Consecutive days (24-25 Oct)');
    console.log('Expected: Streak should increase to 2, then 3');

    // Day 24 Oct
    const { data: checkin3, error: error3 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUserId,
          date: '2024-10-24',
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
      checkin_date: '2024-10-24',
    });

    if (streakError3) {
      console.error('❌ Error updating streak:', streakError3);
      return;
    }

    const { data: streak3 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    console.log('✅ Day 24 streak:', streak3?.current || 0);

    // Day 25 Oct
    const { data: checkin4, error: error4 } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUserId,
          date: '2024-10-25',
          ayat_count: 6,
        },
        { onConflict: 'user_id,date' }
      )
      .select();

    if (error4) {
      console.error('❌ Error creating fourth checkin:', error4);
      return;
    }

    const { error: streakError4 } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: '2024-10-25',
    });

    if (streakError4) {
      console.error('❌ Error updating streak:', streakError4);
      return;
    }

    const { data: streak4 } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    console.log('✅ Day 25 streak:', streak4?.current || 0);

    console.log('\n📊 Final Results:');
    console.log('Expected: 21 Oct = 1, 23 Oct = 1, 24 Oct = 2, 25 Oct = 3');
    console.log('Actual streak:', streak4?.current || 0);
    console.log('Longest streak:', streak4?.longest || 0);
    console.log('Last date:', streak4?.last_date);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStreakScenarios();
