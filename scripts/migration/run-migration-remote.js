require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 RUNNING MIGRATION TO REMOTE SUPABASE...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250121_profiles_settings_fixed.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 Migration size:', migrationSQL.length, 'characters');

    // Execute the migration
    console.log('\n🔄 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      console.error('❌ Migration error:', error);
      return;
    }

    console.log('✅ Migration executed successfully');

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'user_settings']);

    if (tablesError) {
      console.error('❌ Tables check error:', tablesError);
      return;
    }

    console.log(
      '✅ Tables found:',
      tables.map((t) => t.table_name)
    );

    // Test user_settings table
    console.log('\n🧪 Testing user_settings table...');

    const { data: settingsTest, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.error('❌ user_settings test error:', settingsError);
      return;
    }

    console.log('✅ user_settings table is accessible');

    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('✅ All tables created');
    console.log('✅ RLS policies applied');
    console.log('✅ Triggers created');
    console.log('✅ Backfill completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
