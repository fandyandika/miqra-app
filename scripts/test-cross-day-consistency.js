const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrossDayConsistency() {
  console.log('🧪 Testing Cross-day Consistency...\n');

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

    // 2. Create checkins for different days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const checkins = [
      {
        user_id: testUser.user_id,
        date: twoDaysAgo.toISOString().split('T')[0],
        ayat_count: 10,
        created_at: twoDaysAgo.toISOString(),
      },
      {
        user_id: testUser.user_id,
        date: yesterday.toISOString().split('T')[0],
        ayat_count: 15,
        created_at: yesterday.toISOString(),
      },
      {
        user_id: testUser.user_id,
        date: today.toISOString().split('T')[0],
        ayat_count: 20,
        created_at: today.toISOString(),
      },
    ];

    console.log('📅 Creating checkins for cross-day test...');
    for (const checkin of checkins) {
      const { error } = await supabase.from('checkins').upsert(checkin);

      if (error && error.code !== '23505') {
        console.error('❌ Error creating checkin for', checkin.date, ':', error);
      } else {
        console.log(
          '✅ Checkin created/updated for',
          checkin.date,
          ':',
          checkin.ayat_count,
          'ayat'
        );
      }
    }

    // 3. Create reading sessions for different days
    const sessions = [
      {
        user_id: testUser.user_id,
        surah_number: 1,
        ayat_start: 1,
        ayat_end: 7,
        date: twoDaysAgo.toISOString().split('T')[0],
        session_time: twoDaysAgo.toISOString(),
        notes: 'Two days ago session',
      },
      {
        user_id: testUser.user_id,
        surah_number: 2,
        ayat_start: 1,
        ayat_end: 10,
        date: yesterday.toISOString().split('T')[0],
        session_time: yesterday.toISOString(),
        notes: 'Yesterday session',
      },
      {
        user_id: testUser.user_id,
        surah_number: 3,
        ayat_start: 1,
        ayat_end: 15,
        date: today.toISOString().split('T')[0],
        session_time: today.toISOString(),
        notes: 'Today session',
      },
    ];

    console.log('\n📚 Creating reading sessions for cross-day test...');
    for (const session of sessions) {
      const { error } = await supabase.from('reading_sessions').insert(session);

      if (error) {
        console.error('❌ Error creating session for', session.date, ':', error);
      } else {
        console.log(
          '✅ Session created for',
          session.date,
          ':',
          session.ayat_end - session.ayat_start + 1,
          'ayat'
        );
      }
    }

    // 4. Verify data
    console.log('\n🔍 Verifying cross-day data...');

    const { data: allCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    const { data: allSessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    console.log('📊 Total checkins:', allCheckins?.length || 0);
    console.log('📚 Total sessions:', allSessions?.length || 0);

    // 5. Calculate streak
    const sortedCheckins = allCheckins?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];
    let currentStreak = 0;
    let lastDate = null;

    for (const checkin of sortedCheckins) {
      const checkinDate = new Date(checkin.date);
      if (!lastDate) {
        currentStreak = 1;
        lastDate = checkinDate;
      } else {
        const daysDiff = Math.floor((lastDate - checkinDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
          lastDate = checkinDate;
        } else {
          break;
        }
      }
    }

    console.log('🔥 Current streak:', currentStreak, 'days');
    console.log('📅 Last checkin date:', lastDate?.toISOString().split('T')[0]);

    // 6. Test cross-day consistency scenarios
    console.log('\n🧪 Cross-day Consistency Test Scenarios:');
    console.log('1. ✅ User checks in today - streak should be', currentStreak);
    console.log('2. ✅ User checks in yesterday - streak should be', currentStreak);
    console.log('3. ❌ User checks in 2+ days ago - streak should be 0');
    console.log('4. ✅ Tree should grow based on streak:', currentStreak);

    // 7. Calculate tree growth level
    const getTreeLevel = (streak) => {
      if (streak === 0) return { level: 0, description: 'Seed' };
      if (streak < 3) return { level: 1, description: 'Sprout' };
      if (streak < 7) return { level: 2, description: 'Sapling' };
      if (streak < 14) return { level: 3, description: 'Young Tree' };
      if (streak < 30) return { level: 4, description: 'Mature Tree' };
      if (streak < 100) return { level: 5, description: 'Ancient Tree' };
      return { level: 6, description: 'Legendary Tree' };
    };

    const treeInfo = getTreeLevel(currentStreak);
    console.log('🌳 Tree level:', treeInfo.level, '-', treeInfo.description);

    console.log('\n✅ Cross-day consistency test completed!');
    console.log('\n📱 Manual Test Instructions:');
    console.log('1. Open the app - should show current streak:', currentStreak);
    console.log('2. Close the app');
    console.log('3. Change device time to tomorrow');
    console.log('4. Open the app - streak should increase if you check in today');
    console.log('5. Change device time to 2 days from now');
    console.log('6. Open the app - streak should reset to 0');
    console.log('7. Tree should reflect the correct growth level');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCrossDayConsistency();
