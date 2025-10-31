const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStreakZero() {
  console.log('🔍 Debugging Streak Zero Issue...\n');

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
    console.log('👤 Test user:', testUser.display_name, '(ID:', testUser.user_id, ')');

    // 2. Check all checkins
    console.log('\n📅 All checkins:');
    const { data: allCheckins, error: allCheckinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (allCheckinsError) {
      console.error('❌ Error fetching all checkins:', allCheckinsError);
    } else {
      console.log('Total checkins:', allCheckins?.length || 0);
      allCheckins?.forEach((checkin) => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 3. Check current streaks
    console.log('\n🔥 Current streaks:');
    const { data: streaksData, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (streaksError) {
      console.error('❌ Error fetching streaks:', streaksError);
    } else {
      console.log('Streaks data:', streaksData);
    }

    // 4. Check if there are any recent checkins (last 7 days)
    console.log('\n📅 Recent checkins (last 7 days):');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentCheckins, error: recentError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false });

    if (recentError) {
      console.error('❌ Error fetching recent checkins:', recentError);
    } else {
      console.log('Recent checkins:', recentCheckins?.length || 0);
      recentCheckins?.forEach((checkin) => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 5. Calculate streak manually
    console.log('\n🧮 Manual streak calculation:');

    if (recentCheckins && recentCheckins.length > 0) {
      let currentStreak = 0;
      let lastDate = null;

      const sortedCheckins = recentCheckins.sort((a, b) => b.date.localeCompare(a.date));

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        console.log(`  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${currentStreak}`);
        } else {
          // Gap found, streak breaks
          console.log(`    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`);
          break;
        }
      }

      console.log('\n📊 Final calculation:');
      console.log('Current streak:', currentStreak, 'days');
      console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);

      // 6. Update streaks table
      console.log('\n🔧 Updating streaks table...');

      const { data: updateResult, error: updateError } = await supabase
        .from('streaks')
        .upsert(
          {
            user_id: testUser.user_id,
            current: currentStreak,
            longest: Math.max(streaksData?.[0]?.longest || 0, currentStreak),
            last_date: lastDate?.toISOString().split('T')[0] || null,
          },
          {
            onConflict: 'user_id',
          }
        )
        .select();

      if (updateError) {
        console.error('❌ Error updating streaks:', updateError);
      } else {
        console.log('✅ Streaks table updated:', updateResult);
      }
    } else {
      console.log('❌ No recent checkins found!');
    }

    // 7. Verify the update
    console.log('\n🔍 Verifying update...');
    const { data: verifyStreaks, error: verifyError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (verifyError) {
      console.error('❌ Error verifying streaks:', verifyError);
    } else {
      console.log('✅ Verification successful:', verifyStreaks);
    }

    console.log('\n✅ Debug completed!');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStreakZero();
