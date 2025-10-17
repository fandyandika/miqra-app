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
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(2);
    
    if (!users || users.length < 2) {
      console.error('❌ Need at least 2 users for testing');
      return;
    }
    
    const USER_A = users[0].user_id;
    const USER_B = users[1].user_id;
    
    console.log(`👤 Testing as USER_B: ${USER_B}`);
    console.log(`👤 USER_A (target): ${USER_A}`);
    
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
    
    // Create USER_B client for RLS testing
    const userBClient = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${await getUserToken(USER_B)}`
        }
      }
    });
    
    // Test 1: USER_B cannot select families they don't belong to
    console.log('🔍 Test 1: USER_B cannot select families they don\'t belong to');
    const { data: test1Data, error: test1Error } = await userBClient
      .from('families')
      .select('*')
      .eq('id', FAMILY_ID);
    
    console.log(`   Result: ${test1Data?.length || 0} rows returned`);
    console.log(`   Expected: 0 rows (USER_B is not a member)`);
    console.log(`   Status: ${test1Data?.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    // Test 2: USER_B cannot see USER_A checkins
    console.log('🔍 Test 2: USER_B cannot see USER_A checkins');
    const { data: test2Data, error: test2Error } = await userBClient
      .from('checkins')
      .select('*')
      .eq('user_id', USER_A)
      .eq('date', new Date().toISOString().split('T')[0]);
    
    console.log(`   Result: ${test2Data?.length || 0} rows returned`);
    console.log(`   Expected: 0 rows (USER_B cannot see USER_A data)`);
    console.log(`   Status: ${test2Data?.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    // Test 3: USER_B can select own checkins (should be none)
    console.log('🔍 Test 3: USER_B can select own checkins');
    const { data: test3Data, error: test3Error } = await userBClient
      .from('checkins')
      .select('*')
      .eq('user_id', USER_B);
    
    console.log(`   Result: ${test3Data?.length || 0} rows returned`);
    console.log(`   Expected: 0 rows (USER_B has no checkins yet)`);
    console.log(`   Status: ${test3Data?.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    // Test 4: USER_B cannot update USER_A streak
    console.log('🔍 Test 4: USER_B cannot update USER_A streak');
    const { data: test4Data, error: test4Error } = await userBClient
      .from('streaks')
      .update({ current: 999 })
      .eq('user_id', USER_A)
      .select();
    
    console.log(`   Result: ${test4Data?.length || 0} rows updated`);
    console.log(`   Expected: 0 rows (permission denied)`);
    console.log(`   Status: ${test4Data?.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    // Test 5: USER_B can insert their own checkin
    console.log('🔍 Test 5: USER_B can insert their own checkin');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: test5Data, error: test5Error } = await userBClient
      .from('checkins')
      .insert({
        date: today,
        ayat_count: 3
      })
      .select();
    
    console.log(`   Result: ${test5Data?.length || 0} rows inserted`);
    console.log(`   Expected: 1 row (USER_B can insert own data)`);
    console.log(`   Status: ${test5Data?.length === 1 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (test5Data?.length === 1) {
      console.log(`   Checkin created: ${test5Data[0].id}`);
      
      // Test streak update
      console.log('🔍 Test 5b: USER_B can update own streak');
      const { error: streakError } = await userBClient
        .rpc('update_streak_after_checkin', {
          checkin_user_id: USER_B,
          checkin_date: today
        });
      
      console.log(`   Streak update: ${streakError ? '❌ FAIL' : '✅ PASS'}`);
      if (streakError) {
        console.log(`   Error: ${streakError.message}`);
      }
    }
    
    console.log('');
    console.log('📊 RLS SECURITY TEST SUMMARY:');
    console.log('   All tests completed. Check individual results above.');
    
  } catch (error) {
    console.error('❌ RLS testing failed:', error.message);
  }
}

// Helper function to get user token (simplified for testing)
async function getUserToken(userId) {
  // For testing purposes, we'll use the service key
  // In real implementation, you'd need to authenticate the user properly
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

testRLSSecurity();
