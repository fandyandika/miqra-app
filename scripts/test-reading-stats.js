const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetReadingStats() {
  console.log('🧪 TESTING getReadingStats FUNCTION...\n');

  try {
    // Simulate the getReadingStats function for test1 user
    const test1UserId = 'f5d3868a-07a8-4f64-8543-3d4b90d910c9';

    // Set auth context (simulate user login)
    const { data: session } = await supabase.auth.admin.getUserById(test1UserId);
    if (!session.user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 Testing with user: ${session.user.email}`);

    // Get current month range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log(`📅 Date range: ${start} to ${end}`);

    // Get sessions for the month
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count, surah_number')
      .eq('user_id', test1UserId)
      .gte('date', start)
      .lte('date', end);

    console.log(`📊 Sessions found: ${sessions?.length || 0}`);

    // Get checkins for the month
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1UserId)
      .gte('date', start)
      .lte('date', end);

    console.log(`📊 Checkins found: ${checkins?.length || 0}`);

    // Simulate the fixed getReadingStats logic
    const totalAyat = (sessions || []).reduce((sum, s) => sum + (s.ayat_count || 0), 0);
    const totalSessions = (sessions || []).length;

    // Group by date to count unique reading days from BOTH sessions and checkins
    const dateGroups = (sessions || []).reduce((acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + 1;
      return acc;
    }, {});

    // Add checkin dates to ensure we count all reading days
    (checkins || []).forEach((c) => {
      if (!dateGroups[c.date]) {
        dateGroups[c.date] = 1; // Count as 1 reading day even if no sessions
      }
    });

    const daysRead = Object.keys(dateGroups).length;
    const avgPerDay = daysRead > 0 ? Math.round(totalAyat / daysRead) : 0;

    // Surah with most ayat read in range
    const surahCounts = (sessions || []).reduce((acc, s) => {
      const key = Number(s.surah_number);
      acc[key] = (acc[key] || 0) + (s.ayat_count || 0);
      return acc;
    }, {});
    const mostReadSurah = Object.entries(surahCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`Total Ayat: ${totalAyat}`);
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Days Read: ${daysRead}`);
    console.log(`Avg Per Day: ${avgPerDay}`);
    console.log(`Most Read Surah: ${mostReadSurah || 'None'}`);
    console.log(`Reading Dates: ${Object.keys(dateGroups).sort().join(', ')}`);

    // Check if this matches what we expect
    const expectedDays = 6; // Based on our previous analysis
    if (daysRead === expectedDays) {
      console.log('✅ Days read calculation is correct!');
    } else {
      console.log(`❌ Days read should be ${expectedDays}, but got ${daysRead}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGetReadingStats();
