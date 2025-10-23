const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 DEBUGGING REACT NATIVE LOGIN ISSUES...\n');

// Test 1: Check if environment variables are accessible
console.log('1️⃣ CHECKING ENVIRONMENT VARIABLES:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Available' : '❌ Missing');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Available' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ MISSING ENVIRONMENT VARIABLES!');
  console.log('This will cause login to fail in the React Native app.');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Make sure .env file exists in project root');
  console.log('2. Make sure .env contains:');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

// Test 2: Check Supabase client creation
console.log('\n2️⃣ TESTING SUPABASE CLIENT CREATION:');
try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // React Native doesn't use URL detection
    },
  });
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.log('❌ Error creating Supabase client:', error.message);
  process.exit(1);
}

// Test 3: Test authentication flow
console.log('\n3️⃣ TESTING AUTHENTICATION FLOW:');
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

async function testAuthFlow() {
  try {
    // Test sign in
    console.log('   Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test1@miqra.com',
      password: 'password123',
    });

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message);
      return false;
    }

    console.log('   ✅ Sign in successful');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Session exists:', !!signInData.session);

    // Test session persistence
    console.log('   Testing session persistence...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('   ❌ Get session failed:', sessionError.message);
      return false;
    }

    console.log('   ✅ Session persistence works');
    console.log('   Session exists:', !!sessionData.session);

    // Test auth state change
    console.log('   Testing auth state change listener...');
    let authStateChanged = false;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('   Auth state change:', event, session ? 'Session exists' : 'No session');
      authStateChanged = true;
    });

    // Wait for auth state change
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (authStateChanged) {
      console.log('   ✅ Auth state change listener works');
    } else {
      console.log('   ⚠️ Auth state change listener may not be working');
    }

    // Cleanup
    authListener.subscription.unsubscribe();

    // Test sign out
    console.log('   Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log('   ❌ Sign out failed:', signOutError.message);
      return false;
    }

    console.log('   ✅ Sign out successful');
    return true;
  } catch (error) {
    console.log('   ❌ Auth flow test failed:', error.message);
    return false;
  }
}

testAuthFlow().then((success) => {
  console.log('\n4️⃣ TESTING REACT NATIVE SPECIFIC ISSUES:');

  if (success) {
    console.log('✅ Backend authentication works perfectly');
    console.log('\n🔍 POTENTIAL REACT NATIVE ISSUES:');
    console.log('1. Metro bundler cache - try: npx expo start --clear');
    console.log('2. React Native environment - check if running on device/simulator');
    console.log('3. Network connectivity - check if device can reach Supabase');
    console.log('4. Console logs - check Metro bundler console for errors');
    console.log('5. App state - check if app is stuck in loading state');

    console.log('\n🔧 DEBUGGING STEPS:');
    console.log('1. Open Metro bundler console');
    console.log('2. Look for [useAuth] and [LoginScreen] logs');
    console.log('3. Check if "Loading authentication state..." appears');
    console.log('4. Check if auth state changes are detected');
    console.log('5. Try logging in with test1@miqra.com / password123');
  } else {
    console.log('❌ Backend authentication has issues');
    console.log('Fix backend issues first before debugging React Native');
  }
});
