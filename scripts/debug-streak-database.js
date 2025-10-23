const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStreakDatabase() {
  console.log('🔍 Debugging Streak Database...\n');

  try {
    // 1. Get all users
    console.log('👥 All users:');
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, display_name');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    allUsers?.forEach(user => {
      console.log(`  ${user.display_name} (ID: ${user.user_id})`);
    });

    // 2. Check each user's streak
    for (const user of allUsers || []) {
      console.log(`\n👤 Checking user: ${user.display_name} (${user.user_id})`);

      // Get checkins for this user
      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.user_id)
        .order('date', { ascending: false });

      if (checkinsError) {
        console.error(
          `❌ Error fetching checkins for ${user.display_name}:`,
          checkinsError
        );
        continue;
      }

      console.log(`  Checkins: ${checkins?.length || 0}`);
      checkins?.forEach(checkin => {
        console.log(`    ${checkin.date}: ${checkin.ayat_count} ayat`);
      });

      // Calculate streak for this user
      if (checkins && checkins.length > 0) {
        let currentStreak = 0;
        let lastDate = null;

        const sortedCheckins = checkins.sort((a, b) =>
          b.date.localeCompare(a.date)
        );

        // Start from most recent checkin
        let tempDate = new Date(sortedCheckins[0].date);
        currentStreak = 1;
        lastDate = tempDate;

        console.log(`  Starting from ${sortedCheckins[0].date}`);

        // Check consecutive days backwards
        for (let i = 1; i < sortedCheckins.length; i++) {
          const checkinDate = new Date(sortedCheckins[i].date);
          const daysDiff = Math.floor(
            (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
          );

          console.log(
            `    Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`
          );

          if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
            tempDate = checkinDate;
            console.log(`      ✅ Consecutive! Streak now: ${currentStreak}`);
          } else {
            // Gap found, streak breaks
            console.log(
              `      ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`
            );
            break;
          }
        }

        console.log(`  📊 Calculated streak: ${currentStreak} days`);
        console.log(
          `  📅 Last checkin: ${lastDate?.toISOString().split('T')[0]}`
        );

        // Update streaks table for this user
        console.log(`  🔧 Updating streaks table...`);

        const { data: updateResult, error: updateError } = await supabase
          .from('streaks')
          .upsert(
            {
              user_id: user.user_id,
              current: currentStreak,
              longest: Math.max(0, currentStreak),
              last_date: lastDate?.toISOString().split('T')[0] || null,
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (updateError) {
          console.error(`    ❌ Error updating streaks:`, updateError);
        } else {
          console.log(`    ✅ Streaks updated:`, updateResult);
        }
      } else {
        console.log(`  📊 No checkins found - streak: 0`);

        // Update streaks table to 0
        const { data: updateResult, error: updateError } = await supabase
          .from('streaks')
          .upsert(
            {
              user_id: user.user_id,
              current: 0,
              longest: 0,
              last_date: null,
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (updateError) {
          console.error(`    ❌ Error updating streaks:`, updateError);
        } else {
          console.log(`    ✅ Streaks updated:`, updateResult);
        }
      }
    }

    // 3. Verify final streaks
    console.log('\n📊 Final streaks verification:');
    const { data: finalStreaks, error: finalError } = await supabase
      .from('streaks')
      .select('*')
      .order('current', { ascending: false });

    if (finalError) {
      console.error('❌ Error fetching final streaks:', finalError);
    } else {
      finalStreaks?.forEach(streak => {
        console.log(
          `  ${streak.user_id}: ${streak.current} days (last: ${streak.last_date})`
        );
      });
    }

    console.log('\n✅ Database streak debug completed!');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStreakDatabase();
