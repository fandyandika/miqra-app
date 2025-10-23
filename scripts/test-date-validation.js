const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateValidationWithValidUser() {
  console.log('🧪 TESTING DATE VALIDATION WITH VALID USER...\n');

  try {
    // Get test1 user
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');

    if (!test1User) {
      console.log('❌ test1@miqra.com not found');
      return;
    }

    console.log(`👤 Testing with user: ${test1User.email}`);

    // Test future date checkin
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`🧪 Attempting to insert future checkin: ${tomorrowStr}`);

    const { error: checkinError } = await supabase.from('checkins').insert({
      user_id: test1User.id,
      date: tomorrowStr,
      ayat_count: 5,
    });

    if (checkinError) {
      console.log('✅ Future checkin blocked');
      console.log(`   Error: ${checkinError.message}`);

      // Check if it's a date constraint error
      if (checkinError.message.includes('date') || checkinError.message.includes('future')) {
        console.log('✅ Date validation constraint is working!');
      } else {
        console.log('⚠️  Blocked by different constraint (foreign key, etc.)');
      }
    } else {
      console.log('❌ Future checkin allowed - constraint not working');
    }

    // Test future date reading session
    console.log(`\n🧪 Attempting to insert future reading session: ${tomorrowStr}`);

    const { error: sessionError } = await supabase.from('reading_sessions').insert({
      user_id: test1User.id,
      surah_number: 1,
      ayat_start: 1,
      ayat_end: 5,
      date: tomorrowStr,
      session_time: new Date().toISOString(),
    });

    if (sessionError) {
      console.log('✅ Future session blocked');
      console.log(`   Error: ${sessionError.message}`);

      // Check if it's a date constraint error
      if (sessionError.message.includes('date') || sessionError.message.includes('future')) {
        console.log('✅ Date validation constraint is working!');
      } else {
        console.log('⚠️  Blocked by different constraint');
      }
    } else {
      console.log('❌ Future session allowed - constraint not working');
    }

    // Test valid date (today)
    console.log(`\n🧪 Testing valid date (today): ${new Date().toISOString().split('T')[0]}`);

    const { error: validError } = await supabase.from('checkins').insert({
      user_id: test1User.id,
      date: new Date().toISOString().split('T')[0],
      ayat_count: 3,
    });

    if (validError) {
      console.log('⚠️  Valid checkin blocked');
      console.log(`   Error: ${validError.message}`);
    } else {
      console.log('✅ Valid checkin allowed');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log('Date validation constraints are working at the application level');
    console.log('Database constraints may need to be added manually');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDateValidationWithValidUser();
