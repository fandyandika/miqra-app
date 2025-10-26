// Debug dynamic require issue
// Run with: npx tsx scripts/debug-dynamic-require.ts

console.log('🔍 Debugging Dynamic Require Issue...\n');

// Test 1: Static require with known path
console.log('1. Testing static require with known path...');
try {
  const surah006 = require('../assets/quran/ar/surah_006.json');
  console.log('✅ Static require works for surah_006.json');
  console.log(`   - Number: ${surah006.number}`);
  console.log(`   - Name: ${surah006.name}`);
  console.log(`   - Ayat count: ${surah006.ayat_count}`);
} catch (error) {
  console.log('❌ Static require failed:', error.message);
}

// Test 2: Dynamic require with template literal
console.log('\n2. Testing dynamic require with template literal...');
try {
  const number = 6;
  const paddedNumber = String(number).padStart(3, '0');
  console.log(`   - Padded number: ${paddedNumber}`);

  // This is what we're trying in the code
  const path = `../assets/quran/ar/surah_${paddedNumber}.json`;
  console.log(`   - Dynamic path: ${path}`);

  // Try dynamic require
  const surahDynamic = require(path);
  console.log('✅ Dynamic require works!');
  console.log(`   - Number: ${surahDynamic.number}`);
  console.log(`   - Name: ${surahDynamic.name}`);
} catch (error) {
  console.log('❌ Dynamic require failed:', error.message);
  console.log('   This is the Metro bundler limitation!');
  console.log('   Metro does NOT support dynamic require() with template literals');
  console.log('   This is a KNOWN limitation of Metro bundler');
}

// Test 3: Alternative approaches
console.log('\n3. Alternative approaches...');
console.log('   ❌ Dynamic require: Not supported by Metro bundler');
console.log('   ✅ Static imports: Works but needs all files imported');
console.log('   ✅ Lazy loading: Need custom implementation');

// Test 4: Solution - Use a pre-built mapping
console.log('\n4. Solution - Pre-built mapping approach...');
console.log('   Idea: Create a large switch statement');
console.log('   switch(number) {');
console.log('     case 6: return require("../assets/quran/ar/surah_006.json");');
console.log('     case 7: return require("../assets/quran/ar/surah_007.json");');
console.log('     ... (for all surahs)');
console.log('   }');
console.log('   ✅ This would work but creates huge bundle size');
console.log('   ❌ Not practical for 114 surahs');

// Test 5: Another solution - Generated imports
console.log('\n5. Better solution - Generate static imports...');
console.log('   Idea: Use a script to generate all static imports');
console.log('   for (let i = 1; i <= 114; i++) {');
console.log('     generate: `import surah${i}Arabic from ".../surah_${padded(i)}.json"`');
console.log('   }');
console.log('   ✅ Works with Metro bundler');
console.log('   ⚠️ Creates large bundle size');

console.log('\n🎯 CONCLUSION:');
console.log('❌ Dynamic require() with template literals DOES NOT WORK in Metro bundler');
console.log('✅ Only static imports work');
console.log('🤔 We need to either:');
console.log('   - Generate all 114 static imports (large bundle)');
console.log('   - Use a hybrid approach (import most popular surahs statically)');
console.log('   - Implement file-based lazy loading with fetch()');
