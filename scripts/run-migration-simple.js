const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251017_miqra_mvp.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration SQL loaded');
    console.log('⚠️  Note: This script will show you the SQL to run manually.');
    console.log('📋 Copy the following SQL and run it in Supabase Dashboard > SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    console.log('\n✅ After running the SQL in Dashboard, your migration will be complete!');
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }
}

runMigration();
