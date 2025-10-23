const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentStreak() {
  console.log('🔍 Testing Current Streak...\n');

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

    // 2. Check current checkins
    console.log('\n📅 Current checkins:');
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
    } else {
      checkinsData?.forEach(checkin => {
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

    // 4. Calculate what streak should be
    console.log('\n🧮 Calculating what streak should be:');

    if (checkinsData && checkinsData.length > 0) {
      let currentStreak = 0;
      let lastDate = null;

      const sortedCheckins = checkinsData.sort((a, b) =>
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
      console.log('Current streak:', currentStreak, 'days');
      console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);

      // Compare with database
      if (streaksData && streaksData.length > 0) {
        const dbStreak = streaksData[0];
        console.log('Database streak:', dbStreak.current, 'days');
        console.log('Match:', dbStreak.current === currentStreak ? '✅' : '❌');

        if (dbStreak.current !== currentStreak) {
          console.log('\n🔧 Updating streaks table...');

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
            console.log('✅ Streaks table updated:', updateResult);
          }
        }
      }
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCurrentStreak();
