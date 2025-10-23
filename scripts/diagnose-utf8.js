const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSING UTF-8 ENCODING ISSUES...\n');

// Check main files for UTF-8 issues
const mainFiles = [
  'App.tsx',
  'index.ts',
  'src/hooks/useAuth.ts',
  'src/screens/auth/LoginScreen.tsx',
  'src/services/auth.ts',
  'src/lib/supabase.ts',
];

function checkFileEncoding(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ ${filePath}: Valid UTF-8`);
    return true;
  } catch (error) {
    if (error.message.includes('Invalid UTF-8')) {
      console.log(`❌ ${filePath}: Invalid UTF-8 encoding`);
      return false;
    } else {
      console.log(`⚠️  ${filePath}: ${error.message}`);
      return false;
    }
  }
}

console.log('1️⃣ CHECKING MAIN FILES:');
let allValid = true;

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (!checkFileEncoding(file)) {
      allValid = false;
    }
  } else {
    console.log(`⚠️  ${file}: File not found`);
  }
});

console.log('\n2️⃣ CHECKING FOR COMMON UTF-8 ISSUES:');

// Check for common problematic characters
const problematicChars = [
  '\u201C', // Left double quotation mark
  '\u201D', // Right double quotation mark
  '\u2018', // Left single quotation mark
  '\u2019', // Right single quotation mark
  '\u2013', // En dash
  '\u2014', // Em dash
  '\u2026', // Horizontal ellipsis
];

function checkForProblematicChars(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = [];

    problematicChars.forEach(char => {
      if (content.includes(char)) {
        found.push(char);
      }
    });

    if (found.length > 0) {
      console.log(
        `⚠️  ${filePath}: Contains problematic characters: ${found.join(', ')}`
      );
      return false;
    } else {
      console.log(`✅ ${filePath}: No problematic characters`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${filePath}: Error reading file - ${error.message}`);
    return false;
  }
}

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checkForProblematicChars(file);
  }
});

console.log('\n3️⃣ CHECKING PACKAGE.JSON:');
if (fs.existsSync('package.json')) {
  checkFileEncoding('package.json');
} else {
  console.log('❌ package.json not found');
  allValid = false;
}

console.log('\n4️⃣ CHECKING METRO CONFIG:');
if (fs.existsSync('metro.config.js')) {
  checkFileEncoding('metro.config.js');
} else {
  console.log('⚠️  metro.config.js not found');
}

console.log('\n5️⃣ CHECKING BABEL CONFIG:');
if (fs.existsSync('babel.config.js')) {
  checkFileEncoding('babel.config.js');
} else {
  console.log('⚠️  babel.config.js not found');
}

console.log('\n6️⃣ CHECKING APP CONFIG:');
if (fs.existsSync('app.config.ts')) {
  checkFileEncoding('app.config.ts');
} else {
  console.log('⚠️  app.config.ts not found');
}

console.log('\n🎯 SUMMARY:');
console.log('===========');

if (allValid) {
  console.log('✅ All main files have valid UTF-8 encoding');
  console.log('\n🔧 POTENTIAL SOLUTIONS:');
  console.log('1. Clear Metro bundler cache: npx expo start --clear');
  console.log(
    '2. Clear React Native cache: npx react-native start --reset-cache'
  );
  console.log(
    '3. Delete node_modules and reinstall: rm -rf node_modules && npm install'
  );
  console.log('4. Check for hidden characters in files');
  console.log('5. Restart Metro bundler completely');
} else {
  console.log('❌ Some files have encoding issues');
  console.log('\n🔧 FIXES NEEDED:');
  console.log('1. Re-save files with UTF-8 encoding');
  console.log('2. Remove problematic characters');
  console.log('3. Check file encoding in your editor');
}

console.log('\n📱 NEXT STEPS:');
console.log('1. Try: npx expo start --clear');
console.log('2. Check Metro bundler console for specific error line');
console.log('3. Look for the exact file and line causing the UTF-8 error');
console.log('4. If error persists, check all recently modified files');
