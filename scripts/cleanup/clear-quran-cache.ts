// Clear Quran cache script
// Run with: npx tsx scripts/clear-quran-cache.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearQuranCache() {
  console.log('🧹 Clearing Quran Cache...\n');

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

    console.log('\n🎉 Cache cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the app');
    console.log('2. Try opening Surah 2 again');
    console.log('3. Should now load real data instead of placeholder');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Run clear cache
clearQuranCache();
