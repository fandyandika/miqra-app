import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProfilesStructure() {
  try {
    console.log('🔍 Checking profiles table structure...');

    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('📊 Profiles structure:');
    console.log(JSON.stringify(data, null, 2));

    if (data && data.length > 0) {
      console.log('\n📋 Available columns:');
      Object.keys(data[0]).forEach((col) => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });
    }
  } catch (err) {
    console.error('💥 Error:', err);
  }
}

checkProfilesStructure();
