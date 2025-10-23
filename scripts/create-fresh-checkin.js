const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFreshCheckin() {
  console.log('📝 Creating Fresh Checkin...\n');

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

    // 2. Create a fresh checkin for today
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Creating checkin for today:', today);

    const { data: newCheckin, error: checkinError } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id: testUser.user_id,
          date: today,
          ayat_count: 25,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select();

    if (checkinError) {
      console.error('❌ Error creating checkin:', checkinError);
      return;
    }

    console.log('✅ Checkin created:', newCheckin);

    // 3. Update streak
    console.log('\n🔥 Updating streak...');

    // Get all checkins to calculate streak
    const { data: allCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    let currentStreak = 0;
    let lastDate = null;

    if (allCheckins && allCheckins.length > 0) {
      const sortedCheckins = allCheckins.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor(
          (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
          tempDate = checkinDate;
        } else {
          break;
        }
      }
    }

    console.log('Calculated streak:', currentStreak, 'days');

    // Update streaks table
    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
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
      console.error('❌ Error updating streaks:', updateError);
    } else {
      console.log('✅ Streaks updated:', updateResult);
    }

    // 4. Verify final state
    console.log('\n🔍 Final verification:');

    const { data: finalCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false })
      .limit(5);

    console.log('Recent checkins:');
    finalCheckins?.forEach(checkin => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: finalStreaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Final streaks:', finalStreaks);

    console.log('\n✅ Fresh checkin created!');
    console.log('📱 Expected App Behavior:');
    console.log('1. Home screen should show streak:', currentStreak, 'days');
    console.log('2. Calendar should highlight today and consecutive days');
    console.log('3. All data should be real-time synced');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createFreshCheckin();
