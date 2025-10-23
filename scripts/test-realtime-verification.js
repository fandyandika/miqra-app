const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtimeVerification() {
  console.log('🧪 Testing Real-time Sync Verification...\n');

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

    // 2. Create a new reading session
    const testSession = {
      user_id: testUser.user_id,
      surah_number: 3,
      ayat_start: 1,
      ayat_end: 15,
      notes: 'Test real-time verification',
      session_time: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    console.log('📝 Creating new reading session...');
    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert([testSession])
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }

    console.log('✅ Reading session created:', session.id);
    console.log('📊 Ayat count:', session.ayat_count);

    // 3. Get all today's sessions
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .eq('date', today);

    const totalAyatToday =
      todaySessions?.reduce((sum, s) => sum + (s.ayat_count || 0), 0) || 0;
    console.log('📈 Total ayat today:', totalAyatToday);

    // 4. Get all sessions for cumulative progress
    const { data: allSessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id);

    const totalAyatAll =
      allSessions?.reduce((sum, s) => sum + (s.ayat_count || 0), 0) || 0;
    const khatamCount = Math.floor(totalAyatAll / 6236);
    console.log('📚 Total ayat all time:', totalAyatAll);
    console.log('🎯 Khatam count:', khatamCount);

    // 5. Get recent 30 days sessions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const { data: recentSessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', startDate)
      .lte('date', endDate);

    console.log('📅 Recent 30 days sessions:', recentSessions?.length || 0);

    // 6. Calculate unique reading days
    const uniqueDates = new Set(recentSessions?.map(s => s.date) || []);
    console.log('📆 Unique reading days (30d):', uniqueDates.size);

    // 7. Calculate average per day
    const avgPerDay =
      uniqueDates.size > 0 ? Math.round(totalAyatAll / uniqueDates.size) : 0;
    console.log('📊 Average per day:', avgPerDay, 'ayat');

    console.log('\n✅ Real-time verification data prepared!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show:', totalAyatToday, 'ayat hari ini');
    console.log('2. Khatam Progress should show:', totalAyatAll, 'total ayat');
    console.log('3. Khatam Progress should show:', khatamCount, 'khatam count');
    console.log(
      '4. Progress tab should show',
      todaySessions?.length || 0,
      'sessions today'
    );
    console.log('5. All data should update immediately without app restart');

    console.log('\n🔍 Debug Info:');
    console.log(
      '- Today sessions:',
      JSON.stringify(todaySessions?.slice(0, 3), null, 2)
    );
    console.log('- Recent sessions count:', recentSessions?.length || 0);
    console.log('- Total ayat calculation:', totalAyatAll);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealtimeVerification();
