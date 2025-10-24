import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixHasanatFunctions() {
  console.log('🔧 Fixing hasanat functions...');

  try {
    // Fix user_timezone function
    console.log('1. Fixing user_timezone function...');
    const { error: timezoneError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION public.user_timezone(p_user UUID)
        RETURNS TEXT
        LANGUAGE sql
        STABLE
        AS $$
          SELECT COALESCE((SELECT timezone FROM public.profiles WHERE user_id = p_user), 'Asia/Jakarta');
        $$;
      `,
    });

    if (timezoneError) {
      console.warn('⚠️ timezone function warning:', timezoneError.message);
    } else {
      console.log('✅ user_timezone function fixed');
    }

    // Test the function
    console.log('2. Testing user_timezone function...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (testData && testData.length > 0) {
      const testUserId = testData[0].user_id;
      const { data: timezoneData, error: timezoneTestError } = await supabase.rpc('user_timezone', {
        p_user: testUserId,
      });

      if (timezoneTestError) {
        console.warn('⚠️ timezone test warning:', timezoneTestError.message);
      } else {
        console.log('✅ user_timezone function test result:', timezoneData);
      }
    }

    console.log('🎉 Hasanat functions fixed successfully!');
  } catch (error) {
    console.error('💥 Error fixing functions:', error);
  }
}

fixHasanatFunctions();
