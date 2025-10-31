// scripts/migration/convert-sql-to-transliteration.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const SQL_FILE = path.join(PROJECT_ROOT, 'assets', 'quran', 'transliterasi', 'quran-indonesia.sql');
const METADATA_FILE = path.join(PROJECT_ROOT, 'assets', 'quran', 'metadata', 'surah_meta_final.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets', 'quran', 'transliterasi');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TransliterationData {
  [surah: number]: {
    [ayah: number]: string;
  };
}

interface SurahInfo {
  name: string;
  ayat_count: number;
}

function parseSqlFile(sqlPath: string): {
  data: TransliterationData;
  totalInserted: number;
  errors: string[];
} {
  const data: TransliterationData = {};
  let totalInserted = 0;
  const errors: string[] = [];

  const content = fs.readFileSync(sqlPath, 'utf-8');
  const lines = content.split('\n');

  // Regex: INSERT INTO quran_id (...) VALUES (id, suraId, verseID, ayahText, indoText, readText);
  const pattern = /INSERT INTO quran_id\s*\([^)]+\)\s*VALUES\s*\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"\s*\);/;

  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const line = lines[lineNum - 1].trim();
    if (!line || line.startsWith('CREATE') || line.startsWith('--')) {
      continue;
    }

    const match = line.match(pattern);
    if (match) {
      try {
        const suraId = parseInt(match[1], 10);
        const verseId = parseInt(match[2], 10);
        const readText = match[3].trim();

        // Validation
        if (suraId < 1 || suraId > 114) {
          errors.push(`Line ${lineNum}: Invalid suraId ${suraId}`);
          continue;
        }
        if (verseId < 1) {
          errors.push(`Line ${lineNum}: Invalid verseID ${verseId}`);
          continue;
        }
        if (!readText) {
          errors.push(`Line ${lineNum}: Empty readText for suraId ${suraId}, verseID ${verseId}`);
          continue;
        }

        if (!data[suraId]) {
          data[suraId] = {};
        }
        data[suraId][verseId] = readText;
        totalInserted++;
      } catch (e: any) {
        errors.push(`Line ${lineNum}: Error parsing - ${e.message}`);
      }
    } else if (line.startsWith('INSERT')) {
      errors.push(`Line ${lineNum}: INSERT statement didn't match pattern`);
    }
  }

  return { data, totalInserted, errors };
}

function loadSurahMetadata(): Record<number, SurahInfo> {
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const surahInfo: Record<number, SurahInfo> = {};

  for (const surah of metadata) {
    surahInfo[surah.number] = {
      name: surah.name_id || surah.name_translit || `Surah ${surah.number}`,
      ayat_count: surah.ayat_count || 0,
    };
  }

  return surahInfo;
}

function validateData(
  data: TransliterationData,
  surahInfo: Record<number, SurahInfo>
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let surahNum = 1; surahNum <= 114; surahNum++) {
    if (!data[surahNum]) {
      errors.push(`Missing surah ${surahNum}`);
      continue;
    }

    if (surahInfo[surahNum]) {
      const expectedCount = surahInfo[surahNum].ayat_count;
      const actualCount = Object.keys(data[surahNum]).length;

      if (actualCount !== expectedCount) {
        warnings.push(
          `Surah ${surahNum}: Expected ${expectedCount} ayat, found ${actualCount}`
        );
      }

      // Check for missing ayat numbers
      for (let i = 1; i <= expectedCount; i++) {
        if (!data[surahNum][i]) {
          errors.push(`Surah ${surahNum}: Missing ayat ${i}`);
        }
      }
    }
  }

  return { errors, warnings };
}

function generateJsonFiles(
  data: TransliterationData,
  surahInfo: Record<number, SurahInfo>
): { count: number; totalAyat: number } {
  let generatedCount = 0;
  let totalAyat = 0;

  const surahNumbers = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);

  for (const surahNum of surahNumbers) {
    const ayatData = data[surahNum];
    const ayatNumbers = Object.keys(ayatData)
      .map(Number)
      .sort((a, b) => a - b);

    const ayatArray = ayatNumbers.map((ayahNum) => ({
      number: ayahNum,
      transliteration: ayatData[ayahNum],
    }));

    const surahName = surahInfo[surahNum]?.name || 'Unknown';

    const output = {
      number: surahNum,
      name: surahName,
      ayat_count: ayatArray.length,
      ayat: ayatArray,
      source: {
        dataset: 'quran-indonesia-sql',
        version: '1.0',
      },
    };

    const outputFile = path.join(
      OUTPUT_DIR,
      `surah_${surahNum.toString().padStart(3, '0')}.trans.json`
    );

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

    generatedCount++;
    totalAyat += ayatArray.length;

    if (totalAyat % 100 === 0 || surahNum <= 5 || surahNum >= 110) {
      console.log(`✅ Generated: surah_${surahNum.toString().padStart(3, '0')}.trans.json (${ayatArray.length} ayat)`);
    }
  }

  return { count: generatedCount, totalAyat };
}

function main() {
  console.log('🔄 Converting SQL to Transliteration JSON files...');
  console.log(`📂 Input: ${SQL_FILE}`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
  console.log();

  // Load metadata
  console.log('📖 Loading surah metadata...');
  const surahInfo = loadSurahMetadata();
  console.log(`✅ Loaded metadata for ${Object.keys(surahInfo).length} surahs`);
  console.log();

  // Parse SQL
  console.log('📖 Parsing SQL file...');
  const { data, totalInserted, errors: parseErrors } = parseSqlFile(SQL_FILE);

  if (parseErrors.length > 0) {
    console.log(`⚠️  Parse warnings/errors: ${parseErrors.length}`);
    for (const error of parseErrors.slice(0, 10)) {
      console.log(`   ${error}`);
    }
    if (parseErrors.length > 10) {
      console.log(`   ... and ${parseErrors.length - 10} more`);
    }
    console.log();
  }

  console.log(`✅ Parsed ${totalInserted} ayat from ${Object.keys(data).length} surahs`);
  console.log();

  // Validate
  console.log('🔍 Validating data...');
  const { errors: validationErrors, warnings: validationWarnings } = validateData(
    data,
    surahInfo
  );

  if (validationWarnings.length > 0) {
    console.log(`⚠️  Validation warnings: ${validationWarnings.length}`);
    for (const warning of validationWarnings.slice(0, 5)) {
      console.log(`   ${warning}`);
    }
    if (validationWarnings.length > 5) {
      console.log(`   ... and ${validationWarnings.length - 5} more`);
    }
    console.log();
  }

  if (validationErrors.length > 0) {
    console.log(`❌ Validation errors: ${validationErrors.length}`);
    for (const error of validationErrors.slice(0, 10)) {
      console.log(`   ${error}`);
    }
    if (validationErrors.length > 10) {
      console.log(`   ... and ${validationErrors.length - 10} more`);
    }
    console.log();
    console.log('⚠️  Proceeding with generation despite errors...');
    console.log();
  } else {
    console.log('✅ Validation passed!');
    console.log();
  }

  // Generate JSON files
  console.log('📝 Generating JSON files...');
  const { count: generatedCount, totalAyat } = generateJsonFiles(data, surahInfo);
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('✅ Conversion complete!');
  console.log(`   - ${generatedCount} surah files generated`);
  console.log(`   - ${totalAyat} total ayat transliterations`);
  console.log(`   - Expected total ayat: 6236`);
  console.log(`   - Output directory: ${OUTPUT_DIR}`);
  console.log();

  if (totalAyat === 6236) {
    console.log('✅ All 6236 ayat successfully converted!');
  } else {
    console.log(
      `⚠️  Expected 6236 ayat, but got ${totalAyat} (${6236 - totalAyat} difference)`
    );
  }
  console.log('='.repeat(60));
}

main();

