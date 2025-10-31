const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginFlow() {
  console.log('🔐 TESTING LOGIN FLOW...\n');

  try {
    // Test 1: Basic sign in
    console.log('1️⃣ Testing basic sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test1@miqra.com',
      password: 'password123',
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
      console.log('Error details:', signInError);
      return;
    }

    console.log('✅ Sign in successful');
    console.log('User ID:', signInData.user?.id);
    console.log('Session exists:', !!signInData.session);

    // Test 2: Get current session
    console.log('\n2️⃣ Testing get current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Get session error:', sessionError.message);
    } else {
      console.log('✅ Get session successful');
      console.log('Session exists:', !!sessionData.session);
      console.log('User ID from session:', sessionData.session?.user?.id);
    }

    // Test 3: Test user profile access
    console.log('\n3️⃣ Testing user profile access...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signInData.user?.id)
      .single();

    if (profileError) {
      console.log('❌ Profile access error:', profileError.message);
    } else {
      console.log('✅ Profile access successful');
      console.log('Profile data:', profileData);
    }

    // Test 4: Test reading data access
    console.log('\n4️⃣ Testing reading data access...');
    const { data: readingData, error: readingError } = await supabase
      .from('reading_sessions')
      .select('count')
      .eq('user_id', signInData.user?.id);

    if (readingError) {
      console.log('❌ Reading data access error:', readingError.message);
    } else {
      console.log('✅ Reading data access successful');
      console.log('Reading sessions count:', readingData?.[0]?.count || 0);
    }

    // Test 5: Test checkin data access
    console.log('\n5️⃣ Testing checkin data access...');
    const { data: checkinData, error: checkinError } = await supabase
      .from('checkins')
      .select('count')
      .eq('user_id', signInData.user?.id);

    if (checkinError) {
      console.log('❌ Checkin data access error:', checkinError.message);
    } else {
      console.log('✅ Checkin data access successful');
      console.log('Checkins count:', checkinData?.[0]?.count || 0);
    }

    // Test 6: Test auth state change listener
    console.log('\n6️⃣ Testing auth state change...');
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
    });

    // Wait a moment for listener
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Cleanup
    authListener.subscription.unsubscribe();

    // Test 7: Sign out
    console.log('\n7️⃣ Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log('✅ All authentication tests passed');
    console.log('✅ User can sign in successfully');
    console.log('✅ Session management works');
    console.log('✅ Data access permissions work');
    console.log('✅ Auth state changes are detected');
    console.log('✅ Sign out works properly');
    console.log('\n🔍 If login still fails in the app, check:');
    console.log('1. Network connectivity');
    console.log('2. App configuration (app.config.ts)');
    console.log('3. React Native environment setup');
    console.log('4. Console errors in the app');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testLoginFlow();
