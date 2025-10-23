const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING DATABASE SCHEMA...\n');

  try {
    // Check reading_sessions table structure
    console.log('📚 READING_SESSIONS TABLE:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .limit(1);

    if (sessionsError) {
      console.log('❌ Error:', sessionsError.message);
    } else if (sessions && sessions.length > 0) {
      console.log('✅ Sample record:', Object.keys(sessions[0]));
    } else {
      console.log('⚠️ No records found');
    }

    // Check checkins table structure
    console.log('\n📊 CHECKINS TABLE:');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .limit(1);

    if (checkinsError) {
      console.log('❌ Error:', checkinsError.message);
    } else if (checkins && checkins.length > 0) {
      console.log('✅ Sample record:', Object.keys(checkins[0]));
    } else {
      console.log('⚠️ No records found');
    }

    // Test inserting a reading session without ayat_count
    console.log('\n🧪 TESTING INSERT WITHOUT AYAT_COUNT:');

    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');

    if (test1User) {
      const { error: insertError } = await supabase.from('reading_sessions').insert({
        user_id: test1User.id,
        surah_number: 1,
        ayat_start: 1,
        ayat_end: 5,
        date: new Date().toISOString().split('T')[0],
        session_time: new Date().toISOString(),
      });

      if (insertError) {
        console.log('❌ Insert error:', insertError.message);
      } else {
        console.log('✅ Insert successful without ayat_count');
      }
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkDatabaseSchema();
