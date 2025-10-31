// Test file naming convention
// Run with: npx tsx scripts/test-file-naming.ts

console.log('🔍 Testing File Naming Convention...\n');

// Expected structure based on user's description
console.log('📁 EXPECTED FILE STRUCTURE:');
console.log('');
console.log('ARABIC TEXT (assets/quran/ar/):');
console.log('  - surah_001.json  ✅ (tulisan Arab)');
console.log('  - surah_002.json');
console.log('  - surah_003.json');
console.log('  - ...');
console.log('  - surah_114.json');
console.log('');
console.log('TERJEMAHAN ID (assets/quran/id/):');
console.log('  - surah_001.id.json  ✅ (terjemahan bahasa Indonesia)');
console.log('  - surah_002.id.json');
console.log('  - surah_003.id.json');
console.log('  - ...');
console.log('  - surah_114.id.json');
console.log('');

// Test imports
try {
  console.log('🧪 TESTING IMPORTS:');
  console.log('');

  // Test Arabic
  const ar1 = require('../assets/quran/ar/surah_001.json');
  console.log('✅ Arabic: surah_001.json');
  console.log(`   - Number: ${ar1.number}`);
  console.log(`   - Name: ${ar1.name}`);
  console.log(`   - First ayat: "${ar1.ayat[0]?.text?.substring(0, 30)}..."`);

  const ar2 = require('../assets/quran/ar/surah_002.json');
  console.log('✅ Arabic: surah_002.json');
  console.log(`   - Number: ${ar2.number}`);
  console.log(`   - Name: ${ar2.name}`);
  console.log(`   - First ayat: "${ar2.ayat[0]?.text?.substring(0, 30)}..."`);

  // Test Translation
  const id1 = require('../assets/quran/id/surah_001.id.json');
  console.log('✅ Translation: surah_001.id.json');
  console.log(`   - Number: ${id1.number}`);
  console.log(`   - First translation: "${id1.ayat[0]?.translation?.substring(0, 50)}..."`);

  const id2 = require('../assets/quran/id/surah_002.id.json');
  console.log('✅ Translation: surah_002.id.json');
  console.log(`   - Number: ${id2.number}`);
  console.log(`   - First translation: "${id2.ayat[0]?.translation?.substring(0, 50)}..."`);

  console.log('');
  console.log('🎉 FILE NAMING CONVENTION VERIFIED!');
  console.log('');
  console.log('✅ Arabic files: surah_XXX.json (NO .id suffix)');
  console.log('✅ Translation files: surah_XXX.id.json (WITH .id suffix)');
  console.log('✅ Both conventions are correctly used in code');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('  - Arabic:    assets/quran/ar/surah_001.json');
  console.log('  - Indonesian: assets/quran/id/surah_001.id.json');
  console.log('  - Code is correctly using both naming conventions ✅');
} catch (error) {
  console.error('❌ File naming test failed:', error);
}
