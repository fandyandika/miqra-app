/**
 * Setup Hasanat System
 *
 * This script will:
 * 1. Apply hasanat migrations
 * 2. Seed letter_counts table
 * 3. Backfill existing data
 *
 * Run: npx ts-node scripts/setup-hasanat.ts
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
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

async function applyMigrations() {
  console.log('🔄 Applying hasanat migrations...');

  try {
    // Apply hasanat system migration
    const migrationSql = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/migrations/20250125_hasanat_system.sql'),
      'utf-8'
    );

    const { error: systemError } = await supabase.rpc('exec_sql', {
      sql: migrationSql,
    });

    if (systemError) {
      console.error('❌ Error applying hasanat system migration:', systemError);
      return false;
    }

    console.log('✅ Hasanat system migration applied');
    return true;
  } catch (error) {
    console.error('❌ Error reading migration file:', error);
    return false;
  }
}

async function seedLetterCounts() {
  console.log('🌱 Seeding letter_counts table...');

  const p = path.resolve(process.cwd(), 'src/data/letter-counts.json');

  if (!fs.existsSync(p)) {
    console.error(`❌ File not found: ${p}`);
    return false;
  }

  const raw = fs.readFileSync(p, 'utf-8');
  const json = JSON.parse(raw);

  const rows = Object.entries(json.data).map(([key, letters]) => {
    const [surahStr, ayahStr] = key.split(':');
    return {
      surah: Number(surahStr),
      ayah: Number(ayahStr),
      letters: Number(letters),
    };
  });

  console.log(`📊 Found ${rows.length} ayat to seed...`);

  // Process in chunks
  const chunkSize = 1000;
  let processed = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('letter_counts').upsert(slice, {
      onConflict: 'surah,ayah',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`❌ Upsert error at chunk ${i}-${i + slice.length}:`, error);
      return false;
    }

    processed += slice.length;
    console.log(`✅ Processed ${processed}/${rows.length} ayat...`);
  }

  console.log('✅ Letter counts seeded successfully!');
  return true;
}

async function backfillData() {
  console.log('🔄 Backfilling existing data...');

  try {
    // Apply backfill migration
    const backfillSql = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/migrations/20250125_hasanat_backfill.sql'),
      'utf-8'
    );

    const { error: backfillError } = await supabase.rpc('exec_sql', {
      sql: backfillSql,
    });

    if (backfillError) {
      console.error('❌ Error applying backfill migration:', backfillError);
      return false;
    }

    console.log('✅ Data backfilled successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error reading backfill file:', error);
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...');

  try {
    // Check letter_counts
    const { count: letterCount, error: letterError } = await supabase
      .from('letter_counts')
      .select('*', { count: 'exact', head: true });

    if (letterError) {
      console.error('❌ Error checking letter_counts:', letterError);
      return false;
    }

    // Check daily_hasanat
    const { count: hasanatCount, error: hasanatError } = await supabase
      .from('daily_hasanat')
      .select('*', { count: 'exact', head: true });

    if (hasanatError) {
      console.error('❌ Error checking daily_hasanat:', hasanatError);
      return false;
    }

    // Check reading_sessions with hasanat
    const { count: sessionCount, error: sessionError } = await supabase
      .from('reading_sessions')
      .select('*', { count: 'exact', head: true })
      .gt('hasanat_earned', 0);

    if (sessionError) {
      console.error('❌ Error checking reading_sessions:', sessionError);
      return false;
    }

    console.log('📊 Setup verification:');
    console.log(`   Letter counts: ${letterCount} ayat`);
    console.log(`   Daily hasanat records: ${hasanatCount} days`);
    console.log(`   Sessions with hasanat: ${sessionCount} sessions`);

    return true;
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Hasanat System Setup...\n');

  // Step 1: Apply migrations
  const migrationSuccess = await applyMigrations();
  if (!migrationSuccess) {
    console.error('💥 Migration failed, stopping setup');
    process.exit(1);
  }

  console.log('');

  // Step 2: Seed letter counts
  const seedSuccess = await seedLetterCounts();
  if (!seedSuccess) {
    console.error('💥 Seeding failed, stopping setup');
    process.exit(1);
  }

  console.log('');

  // Step 3: Backfill data
  const backfillSuccess = await backfillData();
  if (!backfillSuccess) {
    console.error('💥 Backfill failed, stopping setup');
    process.exit(1);
  }

  console.log('');

  // Step 4: Verify setup
  const verifySuccess = await verifySetup();
  if (!verifySuccess) {
    console.error('💥 Verification failed');
    process.exit(1);
  }

  console.log('\n🎉 Hasanat System setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Navigate to Hasanat screen in the app');
  console.log('2. Test creating a reading session');
  console.log('3. Verify hasanat calculation works correctly');
}

main().catch((e) => {
  console.error('💥 Setup failed:', e);
  process.exit(1);
});
