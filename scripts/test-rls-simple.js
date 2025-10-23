const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSSecurity() {
  try {
    console.log('🔒 Starting RLS Security Tests...');

    // Get test users
    const { data: users } = await supabase.from('profiles').select('user_id').limit(2);

    if (!users || users.length < 2) {
      console.error('❌ Need at least 2 users for testing');
      return;
    }

    const USER_A = users[0].user_id;
    const USER_B = users[1].user_id;

    console.log(`👤 USER_A (target): ${USER_A}`);
    console.log(`👤 USER_B (tester): ${USER_B}`);

    // Get family ID for testing
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .eq('created_by', USER_A)
      .limit(1);

    const FAMILY_ID = families?.[0]?.id;
    if (!FAMILY_ID) {
      console.error('❌ No family found for testing');
      return;
    }

    console.log(`🏠 Testing with Family ID: ${FAMILY_ID}`);
    console.log('');

    // Test 1: Check if USER_B is a member of the family
    console.log('🔍 Test 1: Check if USER_B is a member of the family');
    const { data: test1Data } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', FAMILY_ID)
      .eq('user_id', USER_B);

    console.log(`   Result: ${test1Data?.length || 0} rows found`);
    console.log(`   Expected: 1 row (USER_B should be a member)`);
    console.log(`   Status: ${test1Data?.length === 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    // Test 2: Check USER_A checkins (should exist)
    console.log('🔍 Test 2: Check USER_A checkins exist');
    const today = new Date().toISOString().split('T')[0];
    const { data: test2Data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', USER_A)
      .eq('date', today);

    console.log(`   Result: ${test2Data?.length || 0} rows found`);
    console.log(`   Expected: 1 row (USER_A should have checkin)`);
    console.log(`   Status: ${test2Data?.length === 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    // Test 3: Check USER_B checkins (should be none initially)
    console.log('🔍 Test 3: Check USER_B checkins');
    const { data: test3Data } = await supabase.from('checkins').select('*').eq('user_id', USER_B);

    console.log(`   Result: ${test3Data?.length || 0} rows found`);
    console.log(`   Expected: 0 rows (USER_B has no checkins yet)`);
    console.log(`   Status: ${test3Data?.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    // Test 4: Check USER_A streak
    console.log('🔍 Test 4: Check USER_A streak');
    const { data: test4Data } = await supabase.from('streaks').select('*').eq('user_id', USER_A);

    console.log(`   Result: ${test4Data?.length || 0} rows found`);
    console.log(`   Expected: 1 row (USER_A should have streak)`);
    console.log(`   Status: ${test4Data?.length === 1 ? '✅ PASS' : '❌ FAIL'}`);
    if (test4Data?.length === 1) {
      console.log(
        `   Streak data: current=${test4Data[0].current}, longest=${test4Data[0].longest}`
      );
    }
    console.log('');

    // Test 5: Insert checkin for USER_B
    console.log('🔍 Test 5: Insert checkin for USER_B');
    const { data: test5Data, error: test5Error } = await supabase
      .from('checkins')
      .insert({
        user_id: USER_B,
        date: today,
        ayat_count: 3,
      })
      .select();

    console.log(`   Result: ${test5Data?.length || 0} rows inserted`);
    console.log(`   Expected: 1 row (should be able to insert)`);
    console.log(`   Status: ${test5Data?.length === 1 ? '✅ PASS' : '❌ FAIL'}`);
    if (test5Error) {
      console.log(`   Error: ${test5Error.message}`);
    }
    console.log('');

    // Test 6: Update streak for USER_B
    console.log('🔍 Test 6: Update streak for USER_B');
    const { error: streakError } = await supabase.rpc('update_streak_after_checkin', {
      checkin_user_id: USER_B,
      checkin_date: today,
    });

    console.log(`   Result: ${streakError ? 'Error' : 'Success'}`);
    console.log(`   Expected: Success`);
    console.log(`   Status: ${!streakError ? '✅ PASS' : '❌ FAIL'}`);
    if (streakError) {
      console.log(`   Error: ${streakError.message}`);
    }
    console.log('');

    console.log('📊 RLS SECURITY TEST SUMMARY:');
    console.log('   Note: These tests verify data integrity and RPC functions.');
    console.log('   For true RLS testing, you need to authenticate as each user.');
    console.log('   Use Supabase Dashboard > SQL Editor with different user contexts.');
  } catch (error) {
    console.error('❌ RLS testing failed:', error.message);
  }
}

testRLSSecurity();
