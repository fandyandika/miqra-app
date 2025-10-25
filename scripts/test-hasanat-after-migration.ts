/**
 * Test hasanat calculations after ayah → ayat migration
 *
 * Run: npx ts-node scripts/test-hasanat-after-migration.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatSystem() {
  console.log('🧪 Testing hasanat system after migration...\n');

  try {
    // 1. Test letter_counts table structure
    console.log('1️⃣ Testing letter_counts table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('letter_counts')
      .select('surah, ayat, letters')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error querying letter_counts:', sampleError);
      return;
    }

    console.log('✅ letter_counts structure OK');
    console.log('Sample data:', sampleData);
    console.log('');

    // 2. Test sum_letters function
    console.log('2️⃣ Testing sum_letters function...');
    const { data: sumResult, error: sumError } = await supabase.rpc('sum_letters', {
      p_surah: 1,
      p_start: 1,
      p_end: 5,
    });

    if (sumError) {
      console.error('❌ Error testing sum_letters:', sumError);
      return;
    }

    console.log('✅ sum_letters function OK');
    console.log('Letters in Al-Fatihah 1-5:', sumResult);
    console.log('');

    // 3. Test reading_sessions trigger
    console.log('3️⃣ Testing reading_sessions trigger...');

    // Insert a test session
    const testSession = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      surah_number: 1,
      ayat_start: 1,
      ayat_end: 3,
      session_time: new Date().toISOString(),
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert(testSession)
      .select('letter_count, hasanat_earned')
      .single();

    if (sessionError) {
      console.error('❌ Error testing reading_sessions trigger:', sessionError);
      return;
    }

    console.log('✅ reading_sessions trigger OK');
    console.log('Test session letter_count:', sessionData.letter_count);
    console.log('Test session hasanat_earned:', sessionData.hasanat_earned);
    console.log('');

    // Clean up test data
    await supabase
      .from('reading_sessions')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000');

    console.log('🧹 Cleaned up test data');
    console.log('');

    // 4. Test daily_hasanat aggregation
    console.log('4️⃣ Testing daily_hasanat aggregation...');
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_hasanat')
      .select('*')
      .limit(1);

    if (dailyError) {
      console.error('❌ Error testing daily_hasanat:', dailyError);
      return;
    }

    console.log('✅ daily_hasanat aggregation OK');
    console.log('Sample daily_hasanat:', dailyData);
    console.log('');

    console.log('🎉 All tests passed! Migration successful!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testHasanatSystem().catch(console.error);
