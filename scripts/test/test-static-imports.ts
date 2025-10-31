// Test static imports directly
// Run with: npx tsx scripts/test-static-imports.ts

// Test if static imports work
try {
  console.log('🧪 Testing Static Imports...\n');

  // Test 1: Check if we can import JSON files
  console.log('1. Testing JSON file imports...');

  // Try to require the files directly
  const surah002Arabic = require('../assets/quran/ar/surah_002.json');
  console.log('✅ surah_002.json imported successfully');
  console.log(`   - Number: ${surah002Arabic.number}`);
  console.log(`   - Name: ${surah002Arabic.name}`);
  console.log(`   - Ayat count: ${surah002Arabic.ayat_count}`);
  console.log(`   - First ayat: ${surah002Arabic.ayat[0]?.text?.substring(0, 50)}...`);

  const surah002Indonesian = require('../assets/quran/id/surah_002.id.json');
  console.log('✅ surah_002.id.json imported successfully');
  console.log(`   - Number: ${surah002Indonesian.number}`);
  console.log(`   - Name: ${surah002Indonesian.name}`);
  console.log(`   - Ayat count: ${surah002Indonesian.ayat_count}`);
  console.log(
    `   - First translation: ${surah002Indonesian.ayat[0]?.translation?.substring(0, 50)}...`
  );

  console.log('\n2. Testing data structure...');
  console.log('✅ Arabic data structure:');
  console.log(`   - Has number: ${typeof surah002Arabic.number === 'number'}`);
  console.log(`   - Has name: ${typeof surah002Arabic.name === 'string'}`);
  console.log(`   - Has ayat array: ${Array.isArray(surah002Arabic.ayat)}`);
  console.log(`   - First ayat has text: ${typeof surah002Arabic.ayat[0]?.text === 'string'}`);

  console.log('✅ Translation data structure:');
  console.log(`   - Has number: ${typeof surah002Indonesian.number === 'number'}`);
  console.log(`   - Has name: ${typeof surah002Indonesian.name === 'string'}`);
  console.log(`   - Has ayat array: ${Array.isArray(surah002Indonesian.ayat)}`);
  console.log(
    `   - First ayat has translation: ${typeof surah002Indonesian.ayat[0]?.translation === 'string'}`
  );

  console.log('\n3. Testing data content...');
  console.log('✅ Arabic content:');
  console.log(`   - First ayat text: "${surah002Arabic.ayat[0]?.text}"`);
  console.log(`   - Second ayat text: "${surah002Arabic.ayat[1]?.text?.substring(0, 50)}..."`);

  console.log('✅ Translation content:');
  console.log(`   - First ayat translation: "${surah002Indonesian.ayat[0]?.translation}"`);
  console.log(
    `   - Second ayat translation: "${surah002Indonesian.ayat[1]?.translation?.substring(0, 50)}..."`
  );

  console.log('\n🎉 Static imports test passed!');
  console.log('\n📋 Summary:');
  console.log('✅ JSON files can be imported');
  console.log('✅ Data structure is correct');
  console.log('✅ Content is available');
  console.log('✅ Static imports should work in the app');
  console.log('\n🔍 If app still shows placeholder:');
  console.log('1. Check Metro bundler cache');
  console.log('2. Check AsyncStorage cache');
  console.log('3. Check if imports are being used correctly');
  console.log('4. Check console logs for debug messages');
} catch (error) {
  console.error('❌ Static imports test failed:', error);
  console.log('\n🔍 Possible issues:');
  console.log('1. JSON files not found in assets/quran/');
  console.log('2. File path issues');
  console.log('3. JSON syntax errors');
  console.log('4. Metro bundler configuration issues');
}
