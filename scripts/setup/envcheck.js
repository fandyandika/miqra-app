const dotenv = require('dotenv');
dotenv.config();

const urlStatus = process.env.EXPO_PUBLIC_SUPABASE_URL ? 'URL_OK' : 'URL_MISSING';
const keyStatus = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'KEY_OK' : 'KEY_MISSING';

console.log('[ENV]', urlStatus, keyStatus);
