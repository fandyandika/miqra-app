const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStreakCalculation() {
  console.log('🔧 FIXING STREAK CALCULATION LOGIC...\n');

  try {
    // Get current date info
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get test2 user
    const { data: users } = await supabase.auth.admin.listUsers();
    const test2User = users.users.find(u => u.email === 'test2@miqra.com');

    if (!test2User) {
      console.log('❌ test2@miqra.com not found');
      return;
    }

    console.log(`👤 Fixing streak for: ${test2User.email}`);

    const { data: test2Checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test2User.id)
      .order('date', { ascending: true });

    console.log(
      '📅 Test2 checkin dates:',
      test2Checkins.map(c => c.date)
    );

    // CORRECT streak calculation
    // We need to find the longest consecutive sequence ending with the most recent checkin
    const checkinDates = test2Checkins.map(c => c.date).sort();

    let maxStreak = 0;
    let currentStreak = 0;

    // Find all possible consecutive sequences
    for (let i = 0; i < checkinDates.length; i++) {
      let tempStreak = 1;

      // Check consecutive days from this point forward
      for (let j = i + 1; j < checkinDates.length; j++) {
        const currentDate = new Date(checkinDates[j]);
        const prevDate = new Date(checkinDates[j - 1]);
        const daysDiff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          break; // Not consecutive, stop checking
        }
      }

      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    }

    // Now find the current streak (consecutive days ending with the most recent checkin)
    let currentActiveStreak = 0;
    const lastCheckinDate = checkinDates[checkinDates.length - 1];

    // Check if the most recent checkin is today or yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastCheckinDate === todayStr || lastCheckinDate === yesterdayStr) {
      // Find consecutive days ending with the last checkin
      currentActiveStreak = 1;

      for (let i = checkinDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(checkinDates[i + 1]);
        const prevDate = new Date(checkinDates[i]);
        const daysDiff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          currentActiveStreak++;
        } else {
          break; // Not consecutive
        }
      }
    }

    console.log(`📊 Corrected calculation:`);
    console.log(`  Current streak: ${currentActiveStreak}`);
    console.log(`  Longest streak: ${maxStreak}`);
    console.log(`  Last checkin: ${lastCheckinDate}`);
    console.log(`  Today: ${todayStr}`);
    console.log(`  Yesterday: ${yesterdayStr}`);

    // Update the streak in database
    console.log('\n🔄 Updating streak in database...');

    const { error: updateError } = await supabase.from('streaks').upsert(
      {
        user_id: test2User.id,
        current: currentActiveStreak,
        longest: maxStreak,
        last_date: lastCheckinDate,
      },
      { onConflict: 'user_id' }
    );

    if (updateError) {
      console.log('❌ Update error:', updateError.message);
    } else {
      console.log('✅ Streak updated successfully');

      // Verify the update
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .select('current, longest, last_date')
        .eq('user_id', test2User.id)
        .single();

      console.log('📊 Updated streak:', updatedStreak);
    }

    // Also fix test1 by removing future checkin
    console.log('\n🔧 FIXING TEST1 - REMOVING FUTURE CHECKIN...');

    const test1User = users.users.find(u => u.email === 'test1@miqra.com');
    if (test1User) {
      const { error: deleteError } = await supabase
        .from('checkins')
        .delete()
        .eq('user_id', test1User.id)
        .eq('date', '2025-10-23'); // Remove future checkin

      if (deleteError) {
        console.log('❌ Delete error:', deleteError.message);
      } else {
        console.log('✅ Future checkin removed from test1');
      }
    }

    console.log('\n🎉 BOTH ISSUES FIXED!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixStreakCalculation();
