const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtimeSyncFinal() {
  console.log('🔄 Testing Final Real-time Sync...\n');

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

    // 2. Check current state
    console.log('\n📊 Current state:');

    const { data: currentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Current checkins:', currentCheckins?.length || 0);
    currentCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: currentStreaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Current streaks:', currentStreaks);

    // 3. Create a new reading session to trigger real-time sync
    console.log('\n📝 Creating new reading session to test real-time sync...');

    const today = new Date().toISOString().split('T')[0];
    const { data: newSession, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert({
        user_id: testUser.user_id,
        surah_number: 1,
        ayat_start: 1,
        ayat_end: 7,
        date: today,
        session_time: new Date().toISOString(),
        notes: 'Test real-time sync',
      })
      .select();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }

    console.log('✅ New session created:', newSession);

    // 4. Wait a moment for real-time sync to process
    console.log('\n⏳ Waiting for real-time sync to process...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Check if checkins were automatically created/updated
    console.log('\n🔍 Checking if checkins were synced...');

    const { data: updatedCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('Updated checkins:', updatedCheckins?.length || 0);
    updatedCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 6. Check if streak was updated
    console.log('\n🔥 Checking if streak was updated...');

    const { data: updatedStreaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Updated streaks:', updatedStreaks);

    // 7. Calculate what the streak should be
    console.log('\n🧮 Calculating expected streak...');

    let expectedStreak = 0;
    let lastDate = null;

    if (updatedCheckins && updatedCheckins.length > 0) {
      const sortedCheckins = updatedCheckins.sort((a, b) => b.date.localeCompare(a.date));

      let tempDate = new Date(sortedCheckins[0].date);
      expectedStreak = 1;
      lastDate = tempDate;

      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          expectedStreak++;
          tempDate = checkinDate;
        } else {
          break;
        }
      }
    }

    console.log('Expected streak:', expectedStreak, 'days');
    console.log('Last checkin date:', lastDate?.toISOString().split('T')[0] || 'None');

    // 8. Compare with database
    if (updatedStreaks && updatedStreaks.length > 0) {
      const dbStreak = updatedStreaks[0];
      console.log('\n📊 Comparison:');
      console.log('Database streak:', dbStreak.current, 'days');
      console.log('Expected streak:', expectedStreak, 'days');
      console.log('Match:', dbStreak.current === expectedStreak ? '✅' : '❌');
    }

    console.log('\n✅ Real-time sync test completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show updated streak automatically');
    console.log('2. Progress tab should show updated data automatically');
    console.log('3. Calendar should highlight new reading day automatically');
    console.log('4. No need to restart app - everything updates in real-time');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealtimeSyncFinal();
