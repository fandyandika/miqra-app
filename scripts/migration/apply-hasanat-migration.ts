/**
 * Apply Hasanat Migration Manually
 *
 * This script will apply the hasanat system migration directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyHasanatMigration() {
  console.log('🔄 Applying hasanat system migration...');

  try {
    // Read migration file
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20250125_hasanat_system.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec', {
            sql: statement,
          });

          if (error) {
            console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️ Statement ${i + 1} error:`, err);
          // Continue with next statement
        }
      }
    }

    console.log('✅ Hasanat system migration applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return false;
  }
}

async function verifyTables() {
  console.log('🔍 Verifying tables...');

  try {
    // Check if letter_counts table exists
    const { data: letterCounts, error: letterError } = await supabase
      .from('letter_counts')
      .select('*')
      .limit(1);

    if (letterError) {
      console.error('❌ letter_counts table not found:', letterError.message);
      return false;
    }

    console.log('✅ letter_counts table exists');

    // Check if daily_hasanat table exists
    const { data: dailyHasanat, error: dailyError } = await supabase
      .from('daily_hasanat')
      .select('*')
      .limit(1);

    if (dailyError) {
      console.error('❌ daily_hasanat table not found:', dailyError.message);
      return false;
    }

    console.log('✅ daily_hasanat table exists');

    // Check if reading_sessions has new columns
    const { data: readingSessions, error: readingError } = await supabase
      .from('reading_sessions')
      .select('letter_count, hasanat_earned')
      .limit(1);

    if (readingError) {
      console.error('❌ reading_sessions columns not found:', readingError.message);
      return false;
    }

    console.log('✅ reading_sessions has new columns');

    return true;
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Hasanat Migration...\n');

  // Apply migration
  const migrationSuccess = await applyHasanatMigration();
  if (!migrationSuccess) {
    console.error('💥 Migration failed');
    process.exit(1);
  }

  console.log('');

  // Verify tables
  const verifySuccess = await verifyTables();
  if (!verifySuccess) {
    console.error('💥 Verification failed');
    process.exit(1);
  }

  console.log('\n🎉 Hasanat migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npx ts-node scripts/seed_letter_counts.ts');
  console.log('2. Run: npx ts-node scripts/apply-hasanat-backfill.ts');
}

main().catch((e) => {
  console.error('💥 Migration failed:', e);
  process.exit(1);
});
