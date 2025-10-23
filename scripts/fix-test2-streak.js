const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTest2Streak() {
  console.log('🔧 FIXING TEST2 USER STREAK...\n');

  try {
    // Get test2 user
    const { data: users } = await supabase.auth.admin.listUsers();
    const test2User = users.users.find(u => u.email === 'test2@miqra.com');

    if (!test2User) {
      console.log('❌ test2@miqra.com not found');
      return;
    }

    console.log(`👤 Fixing streak for: ${test2User.email}`);

    // Get checkins for test2
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test2User.id)
      .order('date', { ascending: true });

    console.log(`📊 Found ${checkins.length} checkins`);
    console.log(
      '📅 Checkin dates:',
      checkins.map(c => c.date)
    );

    // Calculate correct streak
    const checkinDates = checkins.map(c => c.date).sort();
    let consecutiveDays = 0;
    let currentStreak = 1;
    let maxStreak = 1;

    // Calculate from the end (most recent)
    for (let i = checkinDates.length - 1; i >= 0; i--) {
      const currentDate = new Date(checkinDates[i]);
      const prevDate = i > 0 ? new Date(checkinDates[i - 1]) : null;

      if (prevDate) {
        const daysDiff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        console.log(
          `📅 ${checkinDates[i]} vs ${checkinDates[i - 1]}: ${daysDiff} days diff`
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
          currentStreak = 1;
        }
      }
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    // Check if streak is still active (today or yesterday)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastCheckinDate = checkinDates[checkinDates.length - 1];
    console.log(
      `📅 Last checkin: ${lastCheckinDate}, Today: ${today}, Yesterday: ${yesterdayStr}`
    );

    if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
      consecutiveDays = currentStreak;
    } else {
      consecutiveDays = 0; // Streak broken
    }

    console.log(
      `📊 Calculated streak: ${consecutiveDays} current, ${maxStreak} longest`
    );

    // Update streak in database
    console.log('\n🔄 Updating streak in database...');

    const { error: updateError } = await supabase.from('streaks').upsert(
      {
        user_id: test2User.id,
        current: consecutiveDays,
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

    console.log('\n🎉 TEST2 STREAK FIXED!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTest2Streak();
