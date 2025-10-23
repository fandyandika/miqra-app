const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesSchema() {
  console.log('🔍 CHECKING PROFILES TABLE SCHEMA...\n');

  try {
    // Check if profiles table exists and get its structure
    console.log('1️⃣ Checking profiles table structure...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      console.log('Error code:', profilesError.code);
      console.log('Error hint:', profilesError.hint);

      if (profilesError.code === 'PGRST116') {
        console.log('💡 Table does not exist - need to create it');
      } else if (
        profilesError.message.includes('column') &&
        profilesError.message.includes('does not exist')
      ) {
        console.log('💡 Column issue - need to fix schema');
      }
      return;
    }

    console.log('✅ Profiles table accessible');
    console.log('📊 Sample profile:', profiles[0]);

    // Check table columns by trying to select specific columns
    console.log('\n2️⃣ Checking individual columns...');

    const columnsToCheck = [
      'id',
      'display_name',
      'avatar_url',
      'timezone',
      'language',
      'created_at',
      'updated_at',
    ];

    for (const column of columnsToCheck) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Column '${column}': ${error.message}`);
        } else {
          console.log(`✅ Column '${column}': OK`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}': ${err.message}`);
      }
    }

    // Check if we can update
    console.log('\n3️⃣ Testing update operation...');

    if (profiles.length > 0) {
      const testProfile = profiles[0];
      console.log('👤 Test profile ID:', testProfile.id);

      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: 'Test Update ' + Date.now() })
        .eq('id', testProfile.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        console.log('Error code:', updateError.code);
      } else {
        console.log('✅ Update successful:', updateResult);

        // Revert the change
        await supabase
          .from('profiles')
          .update({ display_name: testProfile.display_name })
          .eq('id', testProfile.id);
        console.log('🔄 Reverted test change');
      }
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkProfilesSchema();
