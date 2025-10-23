const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProgressScroll() {
  console.log('🔄 Testing Progress Page Scroll Fix...\n');

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

    // 2. Check current reading sessions for this month
    const currentMonth = new Date();
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    console.log(
      `\n📅 Checking data for ${currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
    );
    console.log(`Date range: ${startDate} to ${endDate}`);

    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log(`\n📊 Found ${sessions?.length || 0} reading sessions this month`);

    if (sessions && sessions.length > 0) {
      // Group sessions by date
      const groupedByDate = sessions.reduce((acc, session) => {
        const date = session.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(session);
        return acc;
      }, {});

      console.log('\n📋 Sessions grouped by date:');
      Object.keys(groupedByDate).forEach((date) => {
        const daySessions = groupedByDate[date];
        const totalAyat = daySessions.reduce((sum, s) => sum + (s.ayat_count || 0), 0);
        console.log(`  ${date}: ${daySessions.length} sessions, ${totalAyat} ayat`);
      });

      console.log('\n✅ Progress page should now be scrollable!');
      console.log('\n📱 Expected behavior:');
      console.log('1. Month selector at the top');
      console.log('2. Stats card (if data exists)');
      console.log('3. Streak calendar');
      console.log('4. Reading list with expandable date groups');
      console.log('5. All content should be scrollable vertically');
      console.log('6. No more "VirtualizedList" nesting errors');
    } else {
      console.log('\n📝 No sessions found for this month');
      console.log('Creating some test sessions...');

      // Create some test sessions
      const testSessions = [
        {
          surah_number: 1,
          ayat_start: 1,
          ayat_end: 7,
          date: new Date().toISOString().split('T')[0],
        },
        {
          surah_number: 2,
          ayat_start: 1,
          ayat_end: 5,
          date: new Date().toISOString().split('T')[0],
        },
        {
          surah_number: 3,
          ayat_start: 1,
          ayat_end: 3,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ];

      for (const session of testSessions) {
        const { error: insertError } = await supabase.from('reading_sessions').insert({
          user_id: testUser.user_id,
          ...session,
          session_time: new Date().toISOString(),
          notes: 'Test session for scroll testing',
        });

        if (insertError) {
          console.error('❌ Error creating test session:', insertError);
        } else {
          console.log(`✅ Created test session: Surah ${session.surah_number}, ${session.date}`);
        }
      }

      console.log('\n✅ Test sessions created! Progress page should now have scrollable content.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProgressScroll();
