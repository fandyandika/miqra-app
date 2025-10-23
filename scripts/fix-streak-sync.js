const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStreakSync() {
  console.log('🔧 Fixing Streak Sync...\n');

  try {
    // 1. Get test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError);
      return;
    }

    const testUser = users[0];
    console.log(
      '👤 Test user:',
      testUser.display_name,
      '(ID:',
      testUser.user_id,
      ')'
    );

    // 2. Get all checkins for this user
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
      return;
    }

    console.log('📅 Found', checkinsData.length, 'checkins');

    // 3. Calculate current streak from checkins
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;
    let tempStreak = 0;

    if (checkinsData && checkinsData.length > 0) {
      // Sort by date descending
      const sortedCheckins = checkinsData.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      for (let i = 0; i < sortedCheckins.length; i++) {
        const checkin = sortedCheckins[i];
        const checkinDate = new Date(checkin.date);

        if (i === 0) {
          // First checkin (most recent)
          currentStreak = 1;
          tempStreak = 1;
          lastDate = checkinDate;
        } else {
          const prevCheckin = sortedCheckins[i - 1];
          const prevDate = new Date(prevCheckin.date);
          const daysDiff = Math.floor(
            (prevDate - checkinDate) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff === 1) {
            // Consecutive day
            if (i === 1) currentStreak++; // Only increment current streak for the first consecutive day
            tempStreak++;
          } else {
            // Gap found
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1; // Reset temp streak
          }
        }
      }

      // Check if temp streak is longer than longest
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    console.log('🔥 Calculated streaks:');
    console.log('  Current streak:', currentStreak, 'days');
    console.log('  Longest streak:', longestStreak, 'days');
    console.log('  Last date:', lastDate?.toISOString().split('T')[0]);

    // 4. Update streaks table
    console.log('\n📊 Updating streaks table...');

    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
          current: currentStreak,
          longest: longestStreak,
          last_date: lastDate?.toISOString().split('T')[0] || null,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select();

    if (updateError) {
      console.error('❌ Error updating streaks:', updateError);
      return;
    }

    console.log('✅ Streaks table updated:', updateResult);

    // 5. Verify the update
    console.log('\n🔍 Verifying update...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (verifyError) {
      console.error('❌ Error verifying streaks:', verifyError);
    } else {
      console.log('✅ Verification successful:', verifyData);
    }

    console.log('\n🎉 Streak sync fixed!');
    console.log('📱 Expected App Behavior:');
    console.log('1. Home screen should now show', currentStreak, 'days streak');
    console.log('2. Calendar should show', currentStreak, 'days streak');
    console.log('3. Both should be in sync now');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixStreakSync();
