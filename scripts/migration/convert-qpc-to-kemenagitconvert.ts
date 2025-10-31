/**
 * Convert QPC Hafs JSON to Kemenagitconvert Format
 *
 * This script converts the single-file qpc-hafs.json format
 * into the per-surah kemenagitconvert format used by the app.
 */

import fs from 'fs';
import path from 'path';

interface QpcVerse {
  id: number;
  verse_key: string;
  surah: number;
  ayah: number;
  text: string;
}

interface QpcData {
  [key: string]: QpcVerse;
}

interface SurahMetadata {
  number: number;
  name_en: string;
  name_ar: string;
  name_translit: string;
  name_id: string;
  ayat_count: number;
  type: string;
}

interface KemenagitconvertAyah {
  number: number;
  text: string;
}

interface KemenagitconvertSurah {
  number: number;
  name: string;
  ayat_count: number;
  ayat: KemenagitconvertAyah[];
  source: {
    dataset: string;
    version: string;
  };
}

/**
 * Strip verse numbers from the end of text
 * Handles both Arabic numerals (١-٩) and regular digits (0-9)
 */
function stripVerseNumber(text: string): string {
  // Remove trailing Arabic numerals (١-٩) and regular digits
  // Also remove any whitespace before the number
  return text.replace(/\s*[٠-٩0-9]+\s*$/, '').trim();
}

async function convertQpcToKemenagitconvert() {
  console.log('🔄 Starting QPC to Kemenagitconvert conversion...\n');

  const projectRoot = path.resolve(process.cwd());
  const qpcPath = path.join(projectRoot, 'assets', 'quran', 'qpc', 'qpc-hafs.json');
  const metadataPath = path.join(
    projectRoot,
    'assets',
    'quran',
    'metadata',
    'surah_meta_final.json'
  );
  const outputDir = path.join(projectRoot, 'assets', 'quran', 'qpc-converted');

  // Read QPC data
  console.log('📖 Reading qpc-hafs.json...');
  if (!fs.existsSync(qpcPath)) {
    throw new Error(`QPC file not found: ${qpcPath}`);
  }
  const qpcContent = fs.readFileSync(qpcPath, 'utf-8');
  const qpcData: QpcData = JSON.parse(qpcContent);

  // Read metadata
  console.log('📋 Reading surah metadata...');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}`);
  }
  const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
  const metadata: SurahMetadata[] = JSON.parse(metadataContent);

  // Create metadata map
  const metadataMap = new Map<number, SurahMetadata>();
  metadata.forEach((meta) => {
    metadataMap.set(meta.number, meta);
  });

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  // Group verses by surah
  console.log('\n📦 Grouping verses by surah...');
  const surahMap = new Map<number, QpcVerse[]>();

  Object.values(qpcData).forEach((verse) => {
    const surahNum = verse.surah;
    if (!surahMap.has(surahNum)) {
      surahMap.set(surahNum, []);
    }
    surahMap.get(surahNum)!.push(verse);
  });

  // Sort verses within each surah by ayah number
  surahMap.forEach((verses, surahNum) => {
    verses.sort((a, b) => a.ayah - b.ayah);
  });

  console.log(`✅ Found ${surahMap.size} surahs`);

  // Validate completeness
  const totalVerses = Array.from(surahMap.values()).reduce(
    (sum, verses) => sum + verses.length,
    0
  );
  const expectedVerses = 6236;
  console.log(`\n🔍 Validation:`);
  console.log(`   Total verses: ${totalVerses}`);
  console.log(`   Expected: ${expectedVerses}`);
  if (totalVerses !== expectedVerses) {
    console.warn(`   ⚠️  Warning: Verse count mismatch!`);
  }

  // Generate files for each surah (1-114)
  console.log('\n📝 Generating JSON files...');
  let successCount = 0;
  let errorCount = 0;
  const missingSurahs: number[] = [];
  const missingAyat: Array<{ surah: number; expected: number; actual: number }> = [];

  for (let surahNum = 1; surahNum <= 114; surahNum++) {
    const verses = surahMap.get(surahNum);
    const meta = metadataMap.get(surahNum);

    if (!verses || verses.length === 0) {
      missingSurahs.push(surahNum);
      errorCount++;
      console.error(`   ❌ Surah ${surahNum}: Missing data`);
      continue;
    }

    if (!meta) {
      console.warn(`   ⚠️  Surah ${surahNum}: Missing metadata, using fallback name`);
    }

    // Check ayat count
    const expectedCount = meta?.ayat_count || verses.length;
    if (verses.length !== expectedCount) {
      missingAyat.push({
        surah: surahNum,
        expected: expectedCount,
        actual: verses.length,
      });
      console.warn(
        `   ⚠️  Surah ${surahNum}: Ayat count mismatch (expected ${expectedCount}, got ${verses.length})`
      );
    }

    // Convert to kemenagitconvert format
    const convertedAyat: KemenagitconvertAyah[] = verses.map((verse) => ({
      number: verse.ayah,
      text: stripVerseNumber(verse.text),
    }));

    const convertedSurah: KemenagitconvertSurah = {
      number: surahNum,
      name: meta?.name_id || meta?.name_translit || `Surah ${surahNum}`,
      ayat_count: verses.length,
      ayat: convertedAyat,
      source: {
        dataset: 'qpc_hafs_converted',
        version: '1.0',
      },
    };

    // Write file
    const outputPath = path.join(outputDir, `surah_${String(surahNum).padStart(3, '0')}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(convertedSurah, null, 2), 'utf-8');

    successCount++;
    if (surahNum % 10 === 0 || surahNum === 114) {
      console.log(`   ✓ Generated ${surahNum}/114 surahs`);
    }
  }

  // Summary
  console.log('\n📊 Conversion Summary:');
  console.log(`   ✅ Success: ${successCount}/114 surahs`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount} surahs`);
  }
  if (missingSurahs.length > 0) {
    console.log(`   ⚠️  Missing surahs: ${missingSurahs.join(', ')}`);
  }
  if (missingAyat.length > 0) {
    console.log(`   ⚠️  Ayat count mismatches: ${missingAyat.length} surahs`);
    missingAyat.forEach(({ surah, expected, actual }) => {
      console.log(`      - Surah ${surah}: expected ${expected}, got ${actual}`);
    });
  }

  console.log(`\n✅ Conversion complete!`);
  console.log(`   Output directory: ${outputDir}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review a few converted files to verify correctness`);
  console.log(`   2. Test in the app by updating quranData.ts imports`);
  console.log(`   3. If satisfied, replace kemenagitconvert folder`);
}

// Run conversion
convertQpcToKemenagitconvert().catch((error) => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
});

