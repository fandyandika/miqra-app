const fs = require('fs');
const path = require('path');

console.log('🔧 Environment Setup Required');
console.log('Please add the following to your .env file:');
console.log('');
console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
console.log('');
console.log('You can find these credentials in:');
console.log('Supabase Dashboard > Settings > API');
console.log('');
console.log('After adding the credentials, run:');
console.log('node scripts/seed-test-data.js');
