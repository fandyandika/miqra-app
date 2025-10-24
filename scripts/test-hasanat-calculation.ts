import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatCalculation() {
  console.log('🧪 Testing hasanat calculation...');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking tables...');

    const { data: letterCounts, error: letterError } = await supabase
      .from('letter_counts')
      .select('*')
      .limit(1);

    if (letterError) {
      console.error('❌ letter_counts table error:', letterError.message);
      return;
    }
    console.log('✅ letter_counts table exists');

    const { data: dailyHasanat, error: dailyError } = await supabase
      .from('daily_hasanat')
      .select('*')
      .limit(1);

    if (dailyError) {
      console.error('❌ daily_hasanat table error:', dailyError.message);
      return;
    }
    console.log('✅ daily_hasanat table exists');

    // Test 2: Check if reading_sessions has new columns
    console.log('2. Checking reading_sessions columns...');

    const { data: readingSessions, error: readingError } = await supabase
      .from('reading_sessions')
      .select('letter_count, hasanat_earned')
      .limit(1);

    if (readingError) {
      console.error('❌ reading_sessions columns error:', readingError.message);
      return;
    }
    console.log('✅ reading_sessions has new columns');

    // Test 3: Test sum_letters function
    console.log('3. Testing sum_letters function...');

    const { data: sumResult, error: sumError } = await supabase.rpc('sum_letters', {
      p_surah: 1,
      p_start: 1,
      p_end: 3,
    });

    if (sumError) {
      console.error('❌ sum_letters function error:', sumError.message);
      return;
    }
    console.log('✅ sum_letters function works:', sumResult);

    // Test 4: Test user_timezone function
    console.log('4. Testing user_timezone function...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const testUserId = profiles[0].user_id;
    const { data: timezoneResult, error: timezoneError } = await supabase.rpc('user_timezone', {
      p_user: testUserId,
    });

    if (timezoneError) {
      console.error('❌ user_timezone function error:', timezoneError.message);
      return;
    }
    console.log('✅ user_timezone function works:', timezoneResult);

    // Test 5: Test session_local_date function
    console.log('5. Testing session_local_date function...');

    const { data: dateResult, error: dateError } = await supabase.rpc('session_local_date', {
      p_user: testUserId,
      p_ts: new Date().toISOString(),
    });

    if (dateError) {
      console.error('❌ session_local_date function error:', dateError.message);
      return;
    }
    console.log('✅ session_local_date function works:', dateResult);

    console.log('\n🎉 All hasanat functions are working correctly!');
    console.log('\nNext steps:');
    console.log('1. Test creating a reading session to see hasanat calculation');
    console.log('2. Check if daily_hasanat is updated automatically');
  } catch (error) {
    console.error('💥 Error testing hasanat:', error);
  }
}

testHasanatCalculation();
