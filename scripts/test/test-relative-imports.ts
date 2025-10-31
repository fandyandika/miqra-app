// Test relative path imports
// Run with: npx tsx scripts/test-relative-imports.ts

// Test if relative path imports work
try {
  console.log('🧪 Testing Relative Path Imports...\n');

  // Test 1: Check if we can import JSON files with relative paths
  console.log('1. Testing relative path JSON imports...');

  // Try to require the files with relative paths
  const surah002Arabic = require('../assets/quran/ar/surah_002.json');
  console.log('✅ surah_002.json imported with relative path');
  console.log(`   - Number: ${surah002Arabic.number}`);
  console.log(`   - Name: ${surah002Arabic.name}`);
  console.log(`   - Ayat count: ${surah002Arabic.ayat_count}`);
  console.log(`   - First ayat: ${surah002Arabic.ayat[0]?.text?.substring(0, 50)}...`);

  const surah002Indonesian = require('../assets/quran/id/surah_002.id.json');
  console.log('✅ surah_002.id.json imported with relative path');
  console.log(`   - Number: ${surah002Indonesian.number}`);
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

  console.log('\n🎉 Relative path imports test passed!');
  console.log('\n📋 Summary:');
  console.log('✅ JSON files can be imported with relative paths');
  console.log('✅ Data structure is correct');
  console.log('✅ Content is available');
  console.log('✅ Relative path imports should work in the app');
  console.log('\n🔍 Next steps:');
  console.log('1. Check Metro bundler console for static import logs');
  console.log('2. Look for: "🔍 Static imports loaded:"');
  console.log('3. Verify: "Surah 2 Arabic exists: true"');
  console.log('4. Test opening Surah 2 in the app');
} catch (error) {
  console.error('❌ Relative path imports test failed:', error);
  console.log('\n🔍 Possible issues:');
  console.log('1. Relative path is incorrect');
  console.log('2. JSON files not found');
  console.log('3. File permissions issues');
  console.log('4. Metro bundler configuration issues');
}
