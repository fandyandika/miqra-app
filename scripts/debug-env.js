const dotenv = require('dotenv');
const fs = require('fs');

console.log('=== DEBUG ENV ===');
console.log('Current directory:', process.cwd());
console.log('.env exists:', fs.existsSync('.env'));
console.log('.env.local exists:', fs.existsSync('.env.local'));

// Load .env
const result = dotenv.config();
console.log('dotenv result:', result);

console.log('\n=== ENV VARIABLES ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'UNDEFINED');
console.log(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY:',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'UNDEFINED'
);

console.log('\n=== ALL EXPO_PUBLIC_ VARS ===');
Object.keys(process.env)
  .filter((key) => key.startsWith('EXPO_PUBLIC_'))
  .forEach((key) => console.log(`${key}:`, process.env[key] || 'UNDEFINED'));
