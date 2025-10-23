const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUserSpecificStreak() {
  console.log('🔍 Verifying User-Specific Streak Updates...\n');

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

    allUsers?.forEach((user) => {
      console.log(`  ${user.display_name} (ID: ${user.user_id})`);
    });

    // 2. Check each user's data separately
    for (const user of allUsers || []) {
      console.log(`\n👤 Checking user: ${user.display_name} (${user.user_id})`);

      // Get checkins for this specific user
      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.user_id)
        .order('date', { ascending: false });

      if (checkinsError) {
        console.error(`❌ Error fetching checkins for ${user.display_name}:`, checkinsError);
        continue;
      }

      console.log(`  📅 Checkins (${checkins?.length || 0}):`);
      checkins?.forEach((checkin) => {
        console.log(`    ${checkin.date}: ${checkin.ayat_count} ayat`);
      });

      // Get streaks for this specific user
      const { data: streaks, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.user_id);

      if (streaksError) {
        console.error(`❌ Error fetching streaks for ${user.display_name}:`, streaksError);
        continue;
      }

      console.log(`  🔥 Streaks:`);
      if (streaks && streaks.length > 0) {
        const streak = streaks[0];
        console.log(`    Current: ${streak.current} days`);
        console.log(`    Longest: ${streak.longest} days`);
        console.log(`    Last date: ${streak.last_date}`);
      } else {
        console.log(`    No streak data found`);
      }

      // Calculate what the streak should be for this user
      if (checkins && checkins.length > 0) {
        let calculatedStreak = 0;
        let lastDate = null;

        const sortedCheckins = checkins.sort((a, b) => b.date.localeCompare(a.date));

        // Start from most recent checkin
        let tempDate = new Date(sortedCheckins[0].date);
        calculatedStreak = 1;
        lastDate = tempDate;

        console.log(`  🧮 Calculating streak from ${sortedCheckins[0].date}:`);

        // Check consecutive days backwards
        for (let i = 1; i < sortedCheckins.length; i++) {
          const checkinDate = new Date(sortedCheckins[i].date);
          const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

          console.log(`    Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

          if (daysDiff === 1) {
            calculatedStreak++;
            tempDate = checkinDate;
            console.log(`      ✅ Consecutive! Streak now: ${calculatedStreak}`);
          } else {
            console.log(`      ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`);
            break;
          }
        }

        console.log(`  📊 Calculated streak: ${calculatedStreak} days`);
        console.log(`  📅 Last checkin: ${lastDate?.toISOString().split('T')[0]}`);

        // Compare with database
        if (streaks && streaks.length > 0) {
          const dbStreak = streaks[0];
          console.log(`  🔍 Database vs Calculated:`);
          console.log(`    Database: ${dbStreak.current} days`);
          console.log(`    Calculated: ${calculatedStreak} days`);
          console.log(`    Match: ${dbStreak.current === calculatedStreak ? '✅' : '❌'}`);

          if (dbStreak.current !== calculatedStreak) {
            console.log(`  🔧 Updating streak for ${user.display_name}...`);

            const { data: updateResult, error: updateError } = await supabase
              .from('streaks')
              .upsert(
                {
                  user_id: user.user_id,
                  current: calculatedStreak,
                  longest: Math.max(dbStreak.longest || 0, calculatedStreak),
                  last_date: lastDate?.toISOString().split('T')[0] || null,
                },
                {
                  onConflict: 'user_id',
                }
              )
              .select();

            if (updateError) {
              console.error(`    ❌ Error updating streak:`, updateError);
            } else {
              console.log(`    ✅ Streak updated:`, updateResult);
            }
          }
        }
      } else {
        console.log(`  📊 No checkins - streak should be 0`);

        // Update streak to 0 if no checkins
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
          console.error(`    ❌ Error updating streak:`, updateError);
        } else {
          console.log(`    ✅ Streak updated to 0:`, updateResult);
        }
      }
    }

    // 3. Final verification - check all streaks
    console.log('\n📊 Final verification - All streaks:');
    const { data: allStreaks, error: allStreaksError } = await supabase
      .from('streaks')
      .select('*')
      .order('user_id');

    if (allStreaksError) {
      console.error('❌ Error fetching all streaks:', allStreaksError);
    } else {
      allStreaks?.forEach((streak) => {
        const user = allUsers?.find((u) => u.user_id === streak.user_id);
        console.log(
          `  ${user?.display_name || 'Unknown'} (${streak.user_id}): ${streak.current} days (last: ${streak.last_date})`
        );
      });
    }

    // 4. Test cross-user data isolation
    console.log('\n🔒 Testing cross-user data isolation:');

    if (allUsers && allUsers.length >= 2) {
      const user1 = allUsers[0];
      const user2 = allUsers[1];

      console.log(`Testing isolation between ${user1.display_name} and ${user2.display_name}:`);

      // Check if user1's checkins are not visible to user2
      const { data: user1Checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user1.user_id);

      const { data: user2Checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user2.user_id);

      console.log(`  ${user1.display_name} checkins: ${user1Checkins?.length || 0}`);
      console.log(`  ${user2.display_name} checkins: ${user2Checkins?.length || 0}`);

      // Check if user1's streaks are not visible to user2
      const { data: user1Streaks } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user1.user_id);

      const { data: user2Streaks } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user2.user_id);

      console.log(`  ${user1.display_name} streaks: ${user1Streaks?.[0]?.current || 0} days`);
      console.log(`  ${user2.display_name} streaks: ${user2Streaks?.[0]?.current || 0} days`);

      // Verify data isolation
      const user1HasUser2Data = user1Checkins?.some((c) => c.user_id === user2.user_id) || false;
      const user2HasUser1Data = user2Checkins?.some((c) => c.user_id === user1.user_id) || false;

      console.log(`  Data isolation check:`);
      console.log(
        `    ${user1.display_name} has ${user2.display_name} data: ${user1HasUser2Data ? '❌' : '✅'}`
      );
      console.log(
        `    ${user2.display_name} has ${user1.display_name} data: ${user2HasUser1Data ? '❌' : '✅'}`
      );
    }

    console.log('\n✅ User-specific streak verification completed!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyUserSpecificStreak();
