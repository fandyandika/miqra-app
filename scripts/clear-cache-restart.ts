// Clear cache and restart Metro script
// Run with: npx tsx scripts/clear-cache-restart.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function clearCacheAndRestart() {
  console.log('🧹 Clearing Cache and Restarting Metro...\n');

  try {
    // Step 1: Clear Metro cache
    console.log('1. Clearing Metro bundler cache...');
    await execAsync('npx expo start --clear');
    console.log('✅ Metro cache cleared');
  } catch (error) {
    console.log('ℹ️ Metro restart command started (this is expected)');
    console.log('📱 Please check your terminal for Metro bundler output');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Wait for Metro bundler to fully restart');
  console.log('2. Open the app again');
  console.log('3. Try opening Surah 2 (Al-Baqarah)');
  console.log('4. Check console logs for debug messages:');
  console.log('   - 🔍 loadSurahCombined(2, id)');
  console.log('   - 🔍 loadSurahArabic(2)');
  console.log('   - ✅ Found in ARABIC_DATA for surah 2');
  console.log('   - 🔍 loadSurahTranslation(2, id)');
  console.log('   - ✅ Found in TRANSLATION_DATA for surah 2');
  console.log('   - ✅ Successfully loaded surah 2: Al-Baqarah');
  console.log('');
  console.log('🔍 If you still see placeholder text:');
  console.log('1. Check if static imports are working');
  console.log('2. Verify JSON files exist in assets/quran/');
  console.log('3. Check Metro bundler output for import errors');
  console.log('4. Try clearing AsyncStorage cache manually');
}

// Run clear cache and restart
clearCacheAndRestart();
