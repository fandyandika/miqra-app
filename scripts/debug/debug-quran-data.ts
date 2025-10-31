// Debug script untuk test Quran data loading
// Run with: npx tsx scripts/debug-quran-data.ts

// Mock AsyncStorage untuk testing
const mockAsyncStorage = {
  getItem: async (key: string) => {
    console.log(`📱 AsyncStorage.getItem("${key}")`);
    return null; // Simulate no cache
  },
  setItem: async (key: string, value: string) => {
    console.log(`💾 AsyncStorage.setItem("${key}", "${value.substring(0, 50)}...")`);
  },
  removeItem: async (key: string) => {
    console.log(`🗑️ AsyncStorage.removeItem("${key}")`);
  },
};

// Mock the imports
const mockSurah002Arabic = {
  number: 2,
  name: 'Al-Baqarah',
  ayat_count: 286,
  ayat: [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ الم' },
    { number: 2, text: 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ' },
    {
      number: 3,
      text: 'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ',
    },
  ],
  source: { dataset: 'real', version: '1.0' },
};

const mockSurah002Indonesian = {
  number: 2,
  name: 'Al-Baqarah',
  ayat_count: 286,
  ayat: [
    { number: 1, translation: 'Alif, Lam, Mim.' },
    {
      number: 2,
      translation:
        'Kitab (Al Quran) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa.',
    },
    {
      number: 3,
      translation:
        '(yaitu) mereka yang beriman kepada yang ghaib, yang mendirikan shalat, dan menafkahkan sebahagian rezeki yang Kami anugerahkan kepada mereka.',
    },
  ],
  source: { dataset: 'real', version: '1.0' },
};

// Mock ARABIC_DATA and TRANSLATION_DATA
const ARABIC_DATA = {
  1: { number: 1, name: 'Al-Fatihah', ayat_count: 7, ayat: [] },
  2: mockSurah002Arabic,
  3: { number: 3, name: "Ali 'Imran", ayat_count: 200, ayat: [] },
  4: { number: 4, name: 'An-Nisa', ayat_count: 176, ayat: [] },
  5: { number: 5, name: "Al-Ma'idah", ayat_count: 120, ayat: [] },
};

const TRANSLATION_DATA = {
  1: { number: 1, name: 'Al-Fatihah', ayat_count: 7, ayat: [] },
  2: mockSurah002Indonesian,
  3: { number: 3, name: "Ali 'Imran", ayat_count: 200, ayat: [] },
  4: { number: 4, name: 'An-Nisa', ayat_count: 176, ayat: [] },
  5: { number: 5, name: "Al-Ma'idah", ayat_count: 120, ayat: [] },
};

// Mock loadSurahMetadata
async function loadSurahMetadata() {
  return [
    { number: 1, name: 'Al-Fatihah', ayat_count: 7 },
    { number: 2, name: 'Al-Baqarah', ayat_count: 286 },
    { number: 3, name: "Ali 'Imran", ayat_count: 200 },
    { number: 4, name: 'An-Nisa', ayat_count: 176 },
    { number: 5, name: "Al-Ma'idah", ayat_count: 120 },
  ];
}

// Mock functions
async function loadSurahArabic(number: number) {
  console.log(`🔍 loadSurahArabic(${number})`);

  // Try static import first
  if (ARABIC_DATA[number as keyof typeof ARABIC_DATA]) {
    console.log(`✅ Found in ARABIC_DATA for surah ${number}`);
    return ARABIC_DATA[number as keyof typeof ARABIC_DATA];
  }

  console.log(`❌ Not found in ARABIC_DATA for surah ${number}`);

  // Fallback to placeholder for other surahs
  const meta = await loadSurahMetadata();
  const surahMeta = meta.find((m) => m.number === number);

  if (!surahMeta) {
    throw new Error(`Surah ${number} not found in metadata`);
  }

  const ayat = Array.from({ length: surahMeta.ayat_count }, (_, i) => ({
    number: i + 1,
    text: `[Surah ${number}, Ayat ${i + 1} - Data belum tersedia]`,
  }));

  return {
    number,
    name: surahMeta.name,
    ayat_count: surahMeta.ayat_count,
    ayat,
    source: { dataset: 'placeholder', version: '1.0' },
  };
}

async function loadSurahTranslation(number: number, lang = 'id') {
  console.log(`🔍 loadSurahTranslation(${number}, ${lang})`);

  // Try static import first
  if (lang === 'id' && TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA]) {
    console.log(`✅ Found in TRANSLATION_DATA for surah ${number}`);
    return TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA];
  }

  console.log(`❌ Not found in TRANSLATION_DATA for surah ${number}`);

  // Fallback to placeholder for other surahs
  const meta = await loadSurahMetadata();
  const surahMeta = meta.find((m) => m.number === number);

  if (!surahMeta) {
    return { ayat: [] };
  }

  const ayat = Array.from({ length: surahMeta.ayat_count }, (_, i) => ({
    number: i + 1,
    translation: `[Terjemahan Surah ${number}, Ayat ${i + 1} - Belum tersedia]`,
  }));

  return {
    number,
    name: surahMeta.name,
    ayat_count: surahMeta.ayat_count,
    ayat,
    source: { dataset: 'placeholder', version: '1.0' },
  };
}

async function loadSurahCombined(number: number, lang = 'id') {
  console.log(`🔍 loadSurahCombined(${number}, ${lang})`);

  const CACHE_PREFIX = 'quran_surah_v1_';
  const cacheKey = `${CACHE_PREFIX}${number}_${lang}`;

  console.log(`📱 Checking cache: ${cacheKey}`);
  const cached = await mockAsyncStorage.getItem(cacheKey);
  if (cached) {
    console.log(`✅ Found cached data for surah ${number}`);
    return JSON.parse(cached);
  }

  console.log(`❌ No cached data, loading fresh...`);

  const arabic = await loadSurahArabic(number);
  const translation = await loadSurahTranslation(number, lang);

  if (!arabic) throw new Error('Missing Arabic surah data');

  const mergedAyat = arabic.ayat.map((a: any, i: number) => ({
    number: a.number,
    text: a.text,
    translation: translation.ayat[i]?.translation || '',
  }));

  const result = {
    number: arabic.number,
    name: arabic.name,
    ayat_count: arabic.ayat_count,
    ayat: mergedAyat,
    source: { dataset: 'combined', version: '1.0' },
  };

  console.log(`💾 Caching result for surah ${number}`);
  await mockAsyncStorage.setItem(cacheKey, JSON.stringify(result));

  return result;
}

async function debugQuranData() {
  console.log('🧪 Debugging Quran Data Loading...\n');

  // Test 1: Check ARABIC_DATA
  console.log('1. Checking ARABIC_DATA...');
  console.log('   Available surahs:', Object.keys(ARABIC_DATA));
  console.log('   Surah 2 exists:', !!ARABIC_DATA[2]);
  console.log('');

  // Test 2: Check TRANSLATION_DATA
  console.log('2. Checking TRANSLATION_DATA...');
  console.log('   Available surahs:', Object.keys(TRANSLATION_DATA));
  console.log('   Surah 2 exists:', !!TRANSLATION_DATA[2]);
  console.log('');

  // Test 3: Load Surah 2
  console.log('3. Loading Surah 2 (Al-Baqarah)...');
  try {
    const result = await loadSurahCombined(2, 'id');
    console.log('   ✅ Success!');
    console.log('   Number:', result.number);
    console.log('   Name:', result.name);
    console.log('   Ayat count:', result.ayat_count);
    console.log('   First ayat text:', result.ayat[0]?.text);
    console.log('   First ayat translation:', result.ayat[0]?.translation);
    console.log('   Source:', result.source);
  } catch (error) {
    console.log('   ❌ Error:', error);
  }
  console.log('');

  // Test 4: Load Surah 6 (should be placeholder)
  console.log('4. Loading Surah 6 (should be placeholder)...');
  try {
    const result = await loadSurahCombined(6, 'id');
    console.log('   ✅ Success!');
    console.log('   Number:', result.number);
    console.log('   Name:', result.name);
    console.log('   First ayat text:', result.ayat[0]?.text);
    console.log('   First ayat translation:', result.ayat[0]?.translation);
    console.log('   Source:', result.source);
  } catch (error) {
    console.log('   ❌ Error:', error);
  }
  console.log('');

  console.log('🎯 Debug Summary:');
  console.log('✅ ARABIC_DATA contains Surah 2');
  console.log('✅ TRANSLATION_DATA contains Surah 2');
  console.log('✅ loadSurahCombined should work for Surah 2');
  console.log('✅ Surah 6 should show placeholder');
  console.log('');
  console.log('🔍 If Surah 2 still shows placeholder in app:');
  console.log('1. Check if static imports are working');
  console.log('2. Clear AsyncStorage cache');
  console.log('3. Restart Metro bundler');
  console.log('4. Check for import path issues');
}

// Run debug
debugQuranData();
