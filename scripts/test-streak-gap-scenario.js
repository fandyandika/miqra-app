const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreakGapScenario() {
  console.log('🧪 Testing Streak Gap Scenario...\n');

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

    // 2. Create test scenario data
    console.log('\n📅 Creating test scenario data...');

    // Clean existing data
    await supabase.from('checkins').delete().eq('user_id', testUser.user_id);
    await supabase.from('streaks').delete().eq('user_id', testUser.user_id);

    // Create test data for the scenario:
    // Jumat 18 Oktober -> baca
    // Sabtu 19 Oktober -> bolong/tidak baca
    // Ahad 20 Oktober -> baca
    // Senin 21 Oktober -> baca
    // Selasa 22 Oktober (hari ini) -> belum baca

    const testCheckins = [
      { date: '2025-10-18', ayat_count: 10 }, // Jumat - baca
      { date: '2025-10-20', ayat_count: 15 }, // Ahad - baca (skip Sabtu)
      { date: '2025-10-21', ayat_count: 20 }, // Senin - baca
      // Selasa 22 Oktober - belum baca
    ];

    for (const checkin of testCheckins) {
      const { error } = await supabase.from('checkins').insert({
        user_id: testUser.user_id,
        date: checkin.date,
        ayat_count: checkin.ayat_count,
        created_at: new Date(checkin.date + 'T08:00:00Z').toISOString(),
      });

      if (error) {
        console.error('❌ Error creating checkin:', error);
        return;
      }
    }

    console.log('✅ Test data created');

    // 3. Calculate what the streak should be
    console.log('\n🧮 Calculating expected streak...');

    // The correct streak should be 2 days (Ahad + Senin)
    // Because there's a gap on Sabtu, the streak should reset
    // But the current logic might be wrong

    const { data: checkinsData } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Checkins data:');
    checkinsData?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // Calculate streak correctly
    let currentStreak = 0;
    let lastDate = null;

    if (checkinsData && checkinsData.length > 0) {
      const sortedCheckins = checkinsData.sort((a, b) => b.date.localeCompare(a.date));

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        console.log(`  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          tempDate = checkinDate;
        } else {
          // Gap found, streak breaks
          console.log(`  Gap found! Streak breaks at ${sortedCheckins[i].date}`);
          break;
        }
      }
    }

    console.log('\n📊 Results:');
    console.log('Expected streak: 2 days (Ahad + Senin)');
    console.log('Calculated streak:', currentStreak, 'days');
    console.log('Last checkin date:', lastDate?.toISOString().split('T')[0]);
    console.log('Correct:', currentStreak === 2 ? '✅' : '❌');

    // 4. Update streaks table
    console.log('\n📊 Updating streaks table...');

    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
          current: currentStreak,
          longest: currentStreak,
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

    console.log('\n✅ Test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Calendar should show Monday start');
    console.log('2. Day labels should be: Sen, Sel, Rab, Kam, Jum, Aha, Min');
    console.log('3. Streak should show 2 days (not 0)');
    console.log('4. Calendar should highlight Ahad and Senin as reading days');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreakGapScenario();
