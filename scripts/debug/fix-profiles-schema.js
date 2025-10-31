const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfilesSchema() {
  console.log('🔧 FIXING PROFILES TABLE SCHEMA...\n');

  try {
    // Step 1: Add missing columns
    console.log('1️⃣ Adding missing columns...');

    const { error: addColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        alter table public.profiles 
        add column if not exists avatar_url text,
        add column if not exists language text default 'id',
        add column if not exists updated_at timestamptz default now();
      `,
    });

    if (addColumnsError) {
      console.log('❌ Add columns error:', addColumnsError.message);
      // Try direct SQL execution
      console.log('🔄 Trying direct SQL execution...');
    } else {
      console.log('✅ Columns added successfully');
    }

    // Step 2: Check current schema
    console.log('\n2️⃣ Checking current schema...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }

    console.log('📊 Current profile structure:', profiles[0]);

    // Step 3: Test if we can update with current schema
    console.log('\n3️⃣ Testing update with current schema...');

    if (profiles.length > 0) {
      const testProfile = profiles[0];
      const testName = 'Schema Test ' + Date.now();

      // Try update using user_id (current schema)
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: testName })
        .eq('user_id', testProfile.user_id) // Use user_id instead of id
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        console.log('💡 Need to fix the service to use user_id');
      } else {
        console.log('✅ Update successful with user_id:', updateResult);

        // Revert the change
        await supabase
          .from('profiles')
          .update({ display_name: testProfile.display_name })
          .eq('user_id', testProfile.user_id);
        console.log('🔄 Reverted test change');
      }
    }

    console.log('\n🎯 SOLUTION: Update the service to use user_id instead of id');
    console.log('The profiles table uses user_id as primary key, not id');
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  }
}

fixProfilesSchema();
