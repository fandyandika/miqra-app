const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStreakDiscrepancy() {
  console.log('🔍 Debugging Streak Discrepancy...\n');

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

    // 2. Check all checkins for this user
    console.log('\n📅 All checkins for this user:');
    const { data: allCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
      return;
    }

    console.log('Total checkins:', allCheckins?.length || 0);
    allCheckins?.forEach(checkin => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 3. Check streaks table
    console.log('\n🔥 Streaks table data:');
    const { data: streaksData, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (streaksError) {
      console.error('❌ Error fetching streaks:', streaksError);
    } else {
      console.log('Streaks data:', streaksData);
    }

    // 4. Calculate what the streak should be based on checkins
    console.log('\n🧮 Calculating streak from checkins:');

    if (allCheckins && allCheckins.length > 0) {
      let currentStreak = 0;
      let lastDate = null;

      // Sort by date descending (most recent first)
      const sortedCheckins = allCheckins.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor(
          (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
        );

        console.log(
          `  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`
        );

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${currentStreak}`);
        } else {
          // Gap found, streak breaks
          console.log(
            `    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`
          );
          break;
        }
      }

      console.log('\n📊 Final calculation:');
      console.log('Calculated streak:', currentStreak, 'days');
      console.log(
        'Last checkin date:',
        lastDate?.toISOString().split('T')[0] || 'None'
      );

      // Compare with database
      if (streaksData && streaksData.length > 0) {
        const dbStreak = streaksData[0];
        console.log('\n🔍 Comparison:');
        console.log('Database streak:', dbStreak.current, 'days');
        console.log('Calculated streak:', currentStreak, 'days');
        console.log('Match:', dbStreak.current === currentStreak ? '✅' : '❌');

        if (dbStreak.current !== currentStreak) {
          console.log('\n🔧 Updating streaks table to match calculation...');

          const { data: updateResult, error: updateError } = await supabase
            .from('streaks')
            .upsert(
              {
                user_id: testUser.user_id,
                current: currentStreak,
                longest: Math.max(dbStreak.longest || 0, currentStreak),
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
            console.log('✅ Streaks updated:', updateResult);
          }
        }
      }
    }

    // 5. Check if there are any recent checkins (last 7 days)
    console.log('\n📅 Recent checkins (last 7 days):');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentCheckins, error: recentError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: true });

    if (recentError) {
      console.error('❌ Error fetching recent checkins:', recentError);
    } else {
      console.log(
        'Recent checkins (last 7 days):',
        recentCheckins?.length || 0
      );
      recentCheckins?.forEach(checkin => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 6. Calculate streak for recent checkins only
    if (recentCheckins && recentCheckins.length > 0) {
      console.log('\n🧮 Calculating streak from recent checkins only:');

      let recentStreak = 0;
      let lastRecentDate = null;

      const sortedRecent = recentCheckins.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      let tempDate = new Date(sortedRecent[0].date);
      recentStreak = 1;
      lastRecentDate = tempDate;

      console.log(`Starting from ${sortedRecent[0].date}`);

      for (let i = 1; i < sortedRecent.length; i++) {
        const checkinDate = new Date(sortedRecent[i].date);
        const daysDiff = Math.floor(
          (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
        );

        console.log(
          `  Checking ${sortedRecent[i].date}: diff = ${daysDiff} days`
        );

        if (daysDiff === 1) {
          recentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Recent streak now: ${recentStreak}`);
        } else {
          console.log(
            `    ❌ Gap found! Recent streak breaks at ${sortedRecent[i].date}`
          );
          break;
        }
      }

      console.log('Recent streak:', recentStreak, 'days');
    }

    console.log('\n✅ Streak discrepancy debug completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show the correct streak');
    console.log('2. Progress tab should show the same streak');
    console.log('3. Both should be consistent with database');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStreakDiscrepancy();
