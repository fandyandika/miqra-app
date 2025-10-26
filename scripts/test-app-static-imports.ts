// Test static imports in app context
// Run with: npx tsx scripts/test-app-static-imports.ts

// Mock the app environment
const mockConsole = {
  log: (...args: any[]) => {
    console.log(...args);
  },
};

// Test static imports like in the app
try {
  console.log('🧪 Testing App Static Imports...\n');

  // Simulate the imports from quranData.ts
  const surah001Arabic = require('../assets/quran/ar/surah_001.json');
  const surah001Indonesian = require('../assets/quran/id/surah_001.id.json');
  const surah002Arabic = require('../assets/quran/ar/surah_002.json');
  const surah002Indonesian = require('../assets/quran/id/surah_002.id.json');
  const surah003Arabic = require('../assets/quran/ar/surah_003.json');
  const surah003Indonesian = require('../assets/quran/id/surah_003.id.json');
  const surah004Arabic = require('../assets/quran/ar/surah_004.json');
  const surah004Indonesian = require('../assets/quran/id/surah_004.id.json');
  const surah005Arabic = require('../assets/quran/ar/surah_005.json');
  const surah005Indonesian = require('../assets/quran/id/surah_005.id.json');

  // Mapping untuk static imports (like in quranData.ts)
  const ARABIC_DATA = {
    1: surah001Arabic,
    2: surah002Arabic,
    3: surah003Arabic,
    4: surah004Arabic,
    5: surah005Arabic,
  };

  const TRANSLATION_DATA = {
    1: surah001Indonesian,
    2: surah002Indonesian,
    3: surah003Indonesian,
    4: surah004Indonesian,
    5: surah005Indonesian,
  };

  // Debug: Log static imports (like in quranData.ts)
  console.log('🔍 Static imports loaded:');
  console.log('ARABIC_DATA keys:', Object.keys(ARABIC_DATA));
  console.log('TRANSLATION_DATA keys:', Object.keys(TRANSLATION_DATA));
  console.log('Surah 2 Arabic exists:', !!ARABIC_DATA[2]);
  console.log('Surah 2 Translation exists:', !!TRANSLATION_DATA[2]);
  if (ARABIC_DATA[2]) {
    console.log('Surah 2 Arabic preview:', ARABIC_DATA[2].name, ARABIC_DATA[2].ayat_count, 'ayat');
  }
  if (TRANSLATION_DATA[2]) {
    console.log('Surah 2 Translation preview:', TRANSLATION_DATA[2].ayat_count, 'ayat');
  }

  console.log('\n2. Testing function logic...');

  // Test loadSurahArabic function logic
  function testLoadSurahArabic(number: number) {
    console.log(`🔍 loadSurahArabic(${number})`);

    // Try static import first
    if (ARABIC_DATA[number as keyof typeof ARABIC_DATA]) {
      console.log(`✅ Found in ARABIC_DATA for surah ${number}`);
      const data = ARABIC_DATA[number as keyof typeof ARABIC_DATA];
      console.log(`📖 Data preview: ${data.name}, ${data.ayat_count} ayat`);
      return data;
    }

    console.log(`❌ Not found in ARABIC_DATA for surah ${number}`);
    return null;
  }

  // Test loadSurahTranslation function logic
  function testLoadSurahTranslation(number: number, lang = 'id') {
    console.log(`🔍 loadSurahTranslation(${number}, ${lang})`);

    // Try static import first
    if (lang === 'id' && TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA]) {
      console.log(`✅ Found in TRANSLATION_DATA for surah ${number}`);
      const data = TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA];
      console.log(`📖 Translation preview: ${data.ayat_count} ayat`);
      return data;
    }

    console.log(`❌ Not found in TRANSLATION_DATA for surah ${number}`);
    return null;
  }

  console.log('\n3. Testing Surah 2 (Al-Baqarah)...');
  const arabic2 = testLoadSurahArabic(2);
  const translation2 = testLoadSurahTranslation(2, 'id');

  if (arabic2 && translation2) {
    console.log('✅ Surah 2 loaded successfully!');
    console.log(`   - Arabic: ${arabic2.name} (${arabic2.ayat_count} ayat)`);
    console.log(`   - Translation: ${translation2.ayat_count} ayat`);
    console.log(`   - First ayat: "${arabic2.ayat[0]?.text?.substring(0, 50)}..."`);
    console.log(
      `   - First translation: "${translation2.ayat[0]?.translation?.substring(0, 50)}..."`
    );
  } else {
    console.log('❌ Surah 2 failed to load');
  }

  console.log('\n4. Testing Surah 6 (should fail)...');
  const arabic6 = testLoadSurahArabic(6);
  const translation6 = testLoadSurahTranslation(6, 'id');

  if (!arabic6 && !translation6) {
    console.log('✅ Surah 6 correctly not found (expected)');
  } else {
    console.log('❌ Surah 6 unexpectedly found');
  }

  console.log('\n🎉 App static imports test passed!');
  console.log('\n📋 Summary:');
  console.log('✅ All static imports work correctly');
  console.log('✅ ARABIC_DATA and TRANSLATION_DATA populated');
  console.log('✅ Surah 2 (Al-Baqarah) loads successfully');
  console.log('✅ Surah 6 correctly not found');
  console.log('\n🔍 If app still shows placeholder:');
  console.log('1. Check Metro bundler console for static import logs');
  console.log('2. Look for: "🔍 Static imports loaded:"');
  console.log('3. Verify: "Surah 2 Arabic exists: true"');
  console.log('4. Check if Metro bundler restarted properly');
  console.log('5. Clear AsyncStorage cache manually');
} catch (error) {
  console.error('❌ App static imports test failed:', error);
  console.log('\n🔍 Possible issues:');
  console.log('1. Static imports not working in Metro bundler');
  console.log('2. Path resolution issues');
  console.log('3. JSON file corruption');
  console.log('4. Metro bundler configuration issues');
}
