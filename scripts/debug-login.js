const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 DEBUGGING LOGIN ISSUES...\n');

// Check environment variables
console.log('📋 ENVIRONMENT VARIABLES:');
console.log(
  'EXPO_PUBLIC_SUPABASE_URL:',
  process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'
);
console.log(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY:',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
);
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'
);

// Check if we can create Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ MISSING SUPABASE CREDENTIALS!');
  console.log('This is likely why login is not working.');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Create a .env file in the project root');
  console.log('2. Add the following variables:');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

console.log('\n✅ Supabase credentials found');

// Test Supabase connection
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('\n🧪 TESTING SUPABASE CONNECTION...');

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');

    // Test authentication
    console.log('\n🔐 TESTING AUTHENTICATION...');

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: 'test1@miqra.com',
        password: 'password123',
      });

    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      return false;
    }

    console.log('✅ Authentication successful');
    console.log('User ID:', authData.user?.id);

    // Test logout
    await supabase.auth.signOut();
    console.log('✅ Logout successful');

    return true;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Login should work properly.');
  } else {
    console.log('\n❌ TESTS FAILED!');
    console.log('There are issues with the Supabase setup.');
  }
});
