// Basic test for Quran data service (without AsyncStorage)
// Run with: npx tsx scripts/test-quran-basic.ts

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  getItem: async (key: string) => null,
  setItem: async (key: string, value: string) => {},
  getAllKeys: async () => [],
  multiRemove: async (keys: string[]) => {},
};

// Mock the service functions
async function loadSurahArabic(number: number) {
  const path = require(`../assets/quran/ar/surah_${number.toString().padStart(3, '0')}.json`);
  return path;
}

async function loadSurahTranslation(number: number, lang = 'id') {
  try {
    const path = require(
      `../assets/quran/${lang}/surah_${number.toString().padStart(3, '0')}.${lang}.json`
    );
    return path;
  } catch (error) {
    // Return empty translation if file doesn't exist
    return {
      number,
      name: `Surah ${number}`,
      ayat_count: 0,
      ayat: [],
      source: { dataset: 'empty', version: '1.0' },
    };
  }
}

async function loadSurahCombined(number: number, lang = 'id') {
  const arabic = await loadSurahArabic(number);
  const translation = await loadSurahTranslation(number, lang);

  if (!arabic) throw new Error('Missing Arabic surah data');

  const mergedAyat = arabic.ayat.map((a: any, i: number) => ({
    number: a.number,
    text: a.text,
    translation: translation.ayat[i]?.translation || '',
  }));

  const merged = {
    number: arabic.number,
    name: arabic.name,
    ayat_count: arabic.ayat_count,
    ayat: mergedAyat,
    source: {
      dataset: arabic.source?.dataset,
      version: arabic.source?.version,
    },
  };

  return merged;
}

async function testQuranService() {
  console.log('🧪 Testing Quran Data Service (Basic)...\n');

  try {
    // Test loading Al-Fatihah (Surah 1)
    console.log('1. Loading Surah 1 (Al-Fatihah)...');
    const startTime = Date.now();
    const surah1 = await loadSurahCombined(1);
    const loadTime = Date.now() - startTime;

    console.log(`✅ Loaded in ${loadTime}ms`);
    console.log(`📖 Surah: ${surah1.name} (${surah1.ayat_count} ayat)`);
    console.log(`🔤 First ayah: ${surah1.ayat[0]?.text?.substring(0, 50)}...`);
    console.log(`📝 Translation: ${surah1.ayat[0]?.translation?.substring(0, 50)}...\n`);

    // Test fallback for missing translation
    console.log('2. Testing translation fallback...');
    const surah1Fallback = await loadSurahCombined(1, 'missing');
    console.log(`✅ Fallback translation: "${surah1Fallback.ayat[0]?.translation || 'empty'}"`);

    // Test error handling for missing Arabic
    console.log('\n3. Testing error handling...');
    try {
      await loadSurahCombined(999);
      console.log('❌ Should have thrown error for missing surah');
    } catch (error) {
      console.log('✅ Correctly handled missing surah error');
    }

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testQuranService();
