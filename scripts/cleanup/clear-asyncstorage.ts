// Clear AsyncStorage cache manually
// Run with: npx tsx scripts/clear-asyncstorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAsyncStorageCache() {
  console.log('🧹 Clearing AsyncStorage Cache...\n');

  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📱 Found ${keys.length} total keys in AsyncStorage`);

    // Filter Quran cache keys
    const quranKeys = keys.filter((key) => key.startsWith('quran_surah_v1_'));
    console.log(`📖 Found ${quranKeys.length} Quran cache keys:`);
    quranKeys.forEach((key) => console.log(`   - ${key}`));

    if (quranKeys.length > 0) {
      // Remove Quran cache keys
      await AsyncStorage.multiRemove(quranKeys);
      console.log(`✅ Removed ${quranKeys.length} Quran cache keys`);
    } else {
      console.log('ℹ️ No Quran cache keys found');
    }

    // Also clear any other potential cache keys
    const otherCacheKeys = keys.filter(
      (key) => key.includes('quran') || key.includes('surah') || key.includes('ayat')
    );

    if (otherCacheKeys.length > 0) {
      console.log(`🗑️ Found ${otherCacheKeys.length} other Quran-related keys:`);
      otherCacheKeys.forEach((key) => console.log(`   - ${key}`));
      await AsyncStorage.multiRemove(otherCacheKeys);
      console.log(`✅ Removed ${otherCacheKeys.length} other Quran-related keys`);
    }

    console.log('\n🎉 AsyncStorage cache cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the app completely');
    console.log('2. Try opening Surah 2 (Al-Baqarah)');
    console.log('3. Check console logs for:');
    console.log('   - "🔍 Static imports loaded:"');
    console.log('   - "Surah 2 Arabic exists: true"');
    console.log('   - "✅ Found in ARABIC_DATA for surah 2"');
    console.log('4. Should now show real Quran text instead of placeholder');
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage cache:', error);
  }
}

// Run clear cache
clearAsyncStorageCache();
