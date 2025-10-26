// Generate static imports for all 114 surahs
// Run with: npx tsx scripts/generate-static-imports.ts

console.log('🔧 Generating Static Imports for All 114 Surahs...\n');

// Generate imports for Arabic
console.log('// Static imports for Arabic (all 114 surahs)');
for (let i = 1; i <= 114; i++) {
  const padded = String(i).padStart(3, '0');
  console.log(`import surah${padded}Arabic from '../../../assets/quran/ar/surah_${padded}.json';`);
}
console.log('');

// Generate ARABIC_DATA mapping
console.log('const ARABIC_DATA = {');
for (let i = 1; i <= 114; i++) {
  const padded = String(i).padStart(3, '0');
  console.log(`  ${i}: surah${padded}Arabic,`);
}
console.log('};');
console.log('');

// Generate imports for Indonesian translation
console.log('// Static imports for Indonesian translation (all 114 surahs)');
for (let i = 1; i <= 114; i++) {
  const padded = String(i).padStart(3, '0');
  console.log(
    `import surah${padded}Indonesian from '../../../assets/quran/id/surah_${padded}.id.json';`
  );
}
console.log('');

// Generate TRANSLATION_DATA mapping
console.log('const TRANSLATION_DATA = {');
for (let i = 1; i <= 114; i++) {
  const padded = String(i).padStart(3, '0');
  console.log(`  ${i}: surah${padded}Indonesian,`);
}
console.log('};');

console.log('\n📋 Summary:');
console.log('✅ Generated static imports for all 114 surahs');
console.log('✅ Generated ARABIC_DATA mapping');
console.log('✅ Generated TRANSLATION_DATA mapping');
console.log('⚠️ This will create a large bundle size (~20-30 MB)');
console.log('✅ But all surahs will work without "Data belum tersedia"');
