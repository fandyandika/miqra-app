/**
 * Verify QPC Conversion Quality
 *
 * This script verifies the converted QPC files for:
 * - Correct ayat counts
 * - Verse number stripping
 * - Structure validation
 * - Sample text comparison
 */

import fs from 'fs';
import path from 'path';

interface SurahMetadata {
  number: number;
  name_id: string;
  ayat_count: number;
}

interface ConvertedSurah {
  number: number;
  name: string;
  ayat_count: number;
  ayat: Array<{ number: number; text: string }>;
}

async function verifyConversion() {
  console.log('🔍 Verifying QPC conversion...\n');

  const projectRoot = path.resolve(process.cwd());
  const metadataPath = path.join(
    projectRoot,
    'assets',
    'quran',
    'metadata',
    'surah_meta_final.json'
  );
  const convertedDir = path.join(projectRoot, 'assets', 'quran', 'qpc-converted');

  // Read metadata
  const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
  const metadata: SurahMetadata[] = JSON.parse(metadataContent);
  const metadataMap = new Map<number, SurahMetadata>();
  metadata.forEach((meta) => {
    metadataMap.set(meta.number, meta);
  });

  // Check all files
  const issues: Array<{
    surah: number;
    type: string;
    message: string;
  }> = [];

  let totalAyat = 0;
  const ayatWithNumbers: Array<{ surah: number; ayah: number }> = [];
  const missingAyat: Array<{ surah: number; expected: number; actual: number }> = [];

  console.log('📊 Checking surahs...\n');

  for (let surahNum = 1; surahNum <= 114; surahNum++) {
    const filePath = path.join(convertedDir, `surah_${String(surahNum).padStart(3, '0')}.json`);

    if (!fs.existsSync(filePath)) {
      issues.push({
        surah: surahNum,
        type: 'missing_file',
        message: `File not found`,
      });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let surah: ConvertedSurah;

    try {
      surah = JSON.parse(content);
    } catch (error) {
      issues.push({
        surah: surahNum,
        type: 'invalid_json',
        message: `Invalid JSON: ${error}`,
      });
      continue;
    }

    // Check structure
    if (!surah.number || !surah.name || !surah.ayat || !Array.isArray(surah.ayat)) {
      issues.push({
        surah: surahNum,
        type: 'invalid_structure',
        message: `Missing required fields`,
      });
      continue;
    }

    // Check ayat count
    const meta = metadataMap.get(surahNum);
    const expectedCount = meta?.ayat_count || 0;
    const actualCount = surah.ayat.length;

    if (actualCount !== expectedCount) {
      missingAyat.push({
        surah: surahNum,
        expected: expectedCount,
        actual: actualCount,
      });
    }

    totalAyat += actualCount;

    // Check for verse numbers in text (Arabic numerals ٠-٩ and regular 0-9)
    surah.ayat.forEach((ayah) => {
      // Check if text ends with Arabic or regular digits
      const endsWithNumber = /[٠-٩0-9]+\s*$/.test(ayah.text);
      if (endsWithNumber) {
        ayatWithNumbers.push({ surah: surahNum, ayah: ayah.number });
      }
    });

    // Check ayat numbering
    for (let i = 0; i < surah.ayat.length; i++) {
      if (surah.ayat[i].number !== i + 1) {
        issues.push({
          surah: surahNum,
          type: 'wrong_numbering',
          message: `Ayah ${i + 1} has number ${surah.ayat[i].number}`,
        });
      }
    }

    // Progress indicator
    if (surahNum % 20 === 0 || surahNum === 114) {
      console.log(`   ✓ Checked ${surahNum}/114 surahs`);
    }
  }

  // Report results
  console.log('\n📈 Verification Results:\n');

  console.log(`✅ Total ayat: ${totalAyat} (expected: 6236)`);
  if (totalAyat !== 6236) {
    console.log(`   ⚠️  Mismatch: ${Math.abs(6236 - totalAyat)} ayat difference`);
  }

  console.log(`\n📋 Structure Checks:`);
  console.log(`   - Files checked: ${114 - issues.filter((i) => i.type === 'missing_file').length}/114`);

  if (ayatWithNumbers.length > 0) {
    console.log(`\n❌ Verse numbers not stripped:`);
    console.log(`   Found ${ayatWithNumbers.length} ayat with trailing numbers:`);
    ayatWithNumbers.slice(0, 10).forEach(({ surah, ayah }) => {
      console.log(`   - Surah ${surah}, Ayah ${ayah}`);
    });
    if (ayatWithNumbers.length > 10) {
      console.log(`   ... and ${ayatWithNumbers.length - 10} more`);
    }
  } else {
    console.log(`   ✅ All verse numbers stripped correctly`);
  }

  if (missingAyat.length > 0) {
    console.log(`\n⚠️  Ayat count mismatches (${missingAyat.length} surahs):`);
    missingAyat.forEach(({ surah, expected, actual }) => {
      console.log(`   - Surah ${surah}: expected ${expected}, got ${actual} (diff: ${actual - expected})`);
    });
  } else {
    console.log(`   ✅ All ayat counts match metadata`);
  }

  if (issues.length > 0) {
    console.log(`\n❌ Issues found (${issues.length}):`);
    issues.slice(0, 20).forEach((issue) => {
      console.log(`   - Surah ${issue.surah}: ${issue.type} - ${issue.message}`);
    });
    if (issues.length > 20) {
      console.log(`   ... and ${issues.length - 20} more issues`);
    }
  } else {
    console.log(`   ✅ No structural issues found`);
  }

  // Sample comparison
  console.log(`\n📖 Sample Text Comparison:\n`);
  const sampleSurahs = [1, 2, 18, 114];
  sampleSurahs.forEach((surahNum) => {
    const filePath = path.join(convertedDir, `surah_${String(surahNum).padStart(3, '0')}.json`);
    if (fs.existsSync(filePath)) {
      const surah: ConvertedSurah = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (surah.ayat.length > 0) {
        const firstAyah = surah.ayat[0];
        const lastAyah = surah.ayat[surah.ayat.length - 1];
        console.log(`   Surah ${surahNum} (${surah.name}):`);
        console.log(`      Ayah 1: "${firstAyah.text.substring(0, 50)}${firstAyah.text.length > 50 ? '...' : ''}"`);
        console.log(`      Ayah ${lastAyah.number}: "${lastAyah.text.substring(0, 50)}${lastAyah.text.length > 50 ? '...' : ''}"`);
        console.log(`      Total: ${surah.ayat_count} ayat\n`);
      }
    }
  });

  // Final verdict
  console.log(`\n${issues.length === 0 && ayatWithNumbers.length === 0 ? '✅' : '⚠️'} Verification complete!`);

  if (issues.length === 0 && ayatWithNumbers.length === 0 && totalAyat === 6236) {
    console.log(`\n🎉 All checks passed! Files are ready for testing.`);
  } else {
    console.log(`\n⚠️  Please review the issues above before proceeding.`);
  }
}

verifyConversion().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});

