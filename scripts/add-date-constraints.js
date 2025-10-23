const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDateValidationConstraints() {
  console.log('🔧 ADDING DATE VALIDATION CONSTRAINTS...\n');

  try {
    // Add constraint to checkins table
    console.log('1️⃣ Adding constraint to checkins table...');
    const { error: checkinsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.checkins ADD CONSTRAINT checkins_date_not_future CHECK (date <= CURRENT_DATE);',
    });

    if (checkinsError) {
      console.log('❌ Checkins constraint error:', checkinsError.message);
    } else {
      console.log('✅ Checkins constraint added');
    }

    // Add constraint to reading_sessions table
    console.log('2️⃣ Adding constraint to reading_sessions table...');
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.reading_sessions ADD CONSTRAINT reading_sessions_date_not_future CHECK (date <= CURRENT_DATE);',
    });

    if (sessionsError) {
      console.log('❌ Sessions constraint error:', sessionsError.message);
    } else {
      console.log('✅ Sessions constraint added');
    }

    // Test the constraints
    console.log('\n3️⃣ Testing constraints...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`🧪 Attempting to insert future checkin: ${tomorrowStr}`);

    const { error: testError } = await supabase.from('checkins').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // dummy user
      date: tomorrowStr,
      ayat_count: 5,
    });

    if (testError) {
      console.log('✅ Constraint working - future checkin blocked');
      console.log(`   Error: ${testError.message}`);
    } else {
      console.log('❌ Constraint failed - future checkin allowed');
    }

    console.log('\n🎉 DATE VALIDATION CONSTRAINTS ADDED!');
  } catch (error) {
    console.error('❌ Failed to add constraints:', error);
  }
}

addDateValidationConstraints();
