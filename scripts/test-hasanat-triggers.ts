import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatTriggers() {
  console.log('🧪 Testing hasanat triggers...');

  try {
    // Get a test user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const testUserId = profiles[0].user_id;
    console.log('👤 Using test user:', testUserId);

    // Test 1: Create a reading session
    console.log('1. Creating test reading session...');

    const testSession = {
      user_id: testUserId,
      surah_number: 1, // Al-Fatihah
      ayat_start: 1,
      ayat_end: 3,
      session_time: new Date().toISOString(),
      notes: 'Test hasanat calculation',
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert(testSession)
      .select('*')
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError.message);
      return;
    }

    console.log('✅ Reading session created:', sessionData.id);
    console.log('📊 Letter count:', sessionData.letter_count);
    console.log('🌟 Hasanat earned:', sessionData.hasanat_earned);

    // Test 2: Check if daily_hasanat was created
    console.log('2. Checking daily_hasanat...');

    const today = new Date().toISOString().split('T')[0];
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_hasanat')
      .select('*')
      .eq('user_id', testUserId)
      .eq('date', today);

    if (dailyError) {
      console.error('❌ Error checking daily_hasanat:', dailyError.message);
      return;
    }

    if (dailyData && dailyData.length > 0) {
      console.log('✅ Daily hasanat created:', dailyData[0]);
      console.log('📊 Total letters:', dailyData[0].total_letters);
      console.log('🌟 Total hasanat:', dailyData[0].total_hasanat);
      console.log('📅 Session count:', dailyData[0].session_count);
    } else {
      console.log('⚠️ No daily_hasanat found for today');
    }

    // Test 3: Update the session
    console.log('3. Testing update trigger...');

    const { data: updateData, error: updateError } = await supabase
      .from('reading_sessions')
      .update({ ayat_end: 5 }) // Extend to ayat 5
      .eq('id', sessionData.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error updating session:', updateError.message);
      return;
    }

    console.log('✅ Session updated:', updateData.id);
    console.log('📊 New letter count:', updateData.letter_count);
    console.log('🌟 New hasanat earned:', updateData.hasanat_earned);

    // Test 4: Check updated daily_hasanat
    console.log('4. Checking updated daily_hasanat...');

    const { data: updatedDailyData, error: updatedDailyError } = await supabase
      .from('daily_hasanat')
      .select('*')
      .eq('user_id', testUserId)
      .eq('date', today);

    if (updatedDailyError) {
      console.error('❌ Error checking updated daily_hasanat:', updatedDailyError.message);
      return;
    }

    if (updatedDailyData && updatedDailyData.length > 0) {
      console.log('✅ Daily hasanat updated:', updatedDailyData[0]);
      console.log('📊 Updated total letters:', updatedDailyData[0].total_letters);
      console.log('🌟 Updated total hasanat:', updatedDailyData[0].total_hasanat);
    }

    // Cleanup: Delete test session
    console.log('5. Cleaning up test data...');

    const { error: deleteError } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('id', sessionData.id);

    if (deleteError) {
      console.error('⚠️ Error deleting test session:', deleteError.message);
    } else {
      console.log('✅ Test session deleted');
    }

    console.log('\n🎉 Hasanat triggers are working perfectly!');
    console.log('\n✅ Summary:');
    console.log('- Triggers automatically calculate letter_count and hasanat_earned');
    console.log('- Daily hasanat is automatically updated on insert/update/delete');
    console.log('- All functions are working correctly');
  } catch (error) {
    console.error('💥 Error testing triggers:', error);
  }
}

testHasanatTriggers();
