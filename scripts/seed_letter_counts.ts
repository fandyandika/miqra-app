/**
 * Seed letter_counts table from src/data/letter-counts.json
 *
 * Run:
 * 1) npm i -D ts-node
 * 2) Set env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 3) npx ts-node scripts/seed_letter_counts.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type JsonShape = { data: Record<string, number> };

async function main() {
  console.log('🌱 Starting letter_counts seed...');

  const p = path.resolve(process.cwd(), 'src/data/letter-counts.json');

  if (!fs.existsSync(p)) {
    console.error(`❌ File not found: ${p}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(p, 'utf-8');
  const json: JsonShape = JSON.parse(raw);

  const rows = Object.entries(json.data).map(([key, letters]) => {
    const [surahStr, ayahStr] = key.split(':');
    return {
      surah: Number(surahStr),
      ayat: Number(ayahStr),
      letters: Number(letters),
    };
  });

  console.log(`📊 Found ${rows.length} ayat to seed...`);

  // Process in chunks to avoid timeout
  const chunkSize = 1000;
  let processed = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('letter_counts').upsert(slice, {
      onConflict: 'surah,ayat',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`❌ Upsert error at chunk ${i}-${i + slice.length}:`, error);
      process.exit(1);
    }

    processed += slice.length;
    console.log(`✅ Processed ${processed}/${rows.length} ayat...`);
  }

  console.log('🎉 Letter counts seeded successfully!');

  // Verify data
  const { count, error: countError } = await supabase
    .from('letter_counts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn('⚠️ Could not verify count:', countError);
  } else {
    console.log(`📈 Total rows in letter_counts: ${count}`);
  }
}

main().catch((e) => {
  console.error('💥 Script failed:', e);
  process.exit(1);
});
