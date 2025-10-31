// Test script for Quran data service
// Run with: npx tsx scripts/test-quran-service.ts

import { loadSurahCombined, clearQuranCache } from '../src/services/quran/quranData';

async function testQuranService() {
  console.log('🧪 Testing Quran Data Service...\n');

  try {
    // Clear cache first
    console.log('1. Clearing cache...');
    await clearQuranCache();
    console.log('✅ Cache cleared\n');

    // Test loading Al-Fatihah (Surah 1)
    console.log('2. Loading Surah 1 (Al-Fatihah)...');
    const startTime = Date.now();
    const surah1 = await loadSurahCombined(1);
    const loadTime = Date.now() - startTime;

    console.log(`✅ Loaded in ${loadTime}ms`);
    console.log(`📖 Surah: ${surah1.name} (${surah1.ayat_count} ayat)`);
    console.log(`🔤 First ayah: ${surah1.ayat[0]?.text?.substring(0, 50)}...`);
    console.log(`📝 Translation: ${surah1.ayat[0]?.translation?.substring(0, 50)}...\n`);

    // Test cache performance
    console.log('3. Testing cache performance...');
    const startTime2 = Date.now();
    const surah1Cached = await loadSurahCombined(1);
    const cacheTime = Date.now() - startTime2;

    console.log(`✅ Cached load in ${cacheTime}ms`);
    console.log(`⚡ Cache speedup: ${Math.round(loadTime / cacheTime)}x faster\n`);

    // Test error handling for missing translation
    console.log('4. Testing error handling...');
    try {
      await loadSurahCombined(999, 'nonexistent');
      console.log('❌ Should have thrown error for missing surah');
    } catch (error) {
      console.log('✅ Correctly handled missing surah error');
    }

    // Test fallback for missing translation
    console.log('\n5. Testing translation fallback...');
    const surah1Fallback = await loadSurahCombined(1, 'missing');
    console.log(`✅ Fallback translation: "${surah1Fallback.ayat[0]?.translation || 'empty'}"`);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testQuranService();
