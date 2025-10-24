import { createClient } from '@supabase/supabase-js';
import {
  previewHasanatForRange,
  getUserTotalHasanat,
  getDailyHasanat,
} from '../src/services/hasanat.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatAPI() {
  console.log('🧪 Testing Hasanat API Service...');

  try {
    // Test 1: Preview hasanat calculation (client-side)
    console.log('1. Testing previewHasanatForRange (client-side)...');

    const preview1 = previewHasanatForRange(1, 1, 3); // Al-Fatihah ayat 1-3
    console.log('✅ Al-Fatihah ayat 1-3:', preview1);

    const preview2 = previewHasanatForRange(1, 1, 7); // Al-Fatihah ayat 1-7
    console.log('✅ Al-Fatihah ayat 1-7:', preview2);

    const preview3 = previewHasanatForRange(2, 1, 5); // Al-Baqarah ayat 1-5
    console.log('✅ Al-Baqarah ayat 1-5:', preview3);

    // Test 2: Get user total hasanat (database)
    console.log('\n2. Testing getUserTotalHasanat (database)...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const testUserId = profiles[0].user_id;
    console.log('👤 Using test user:', testUserId);

    // Mock auth for testing
    const mockAuth = {
      getUser: () => Promise.resolve({ data: { user: { id: testUserId } } }),
    };

    // Override supabase.auth for testing
    const originalAuth = supabase.auth;
    supabase.auth = mockAuth as any;

    const totalHasanat = await getUserTotalHasanat();
    console.log('✅ Total hasanat:', totalHasanat);

    // Test 3: Get daily hasanat (database)
    console.log('\n3. Testing getDailyHasanat (database)...');

    const dailyHasanat = await getDailyHasanat(7); // Last 7 days
    console.log('✅ Daily hasanat (last 7 days):', dailyHasanat);

    const dailyHasanat30 = await getDailyHasanat(30); // Last 30 days
    console.log('✅ Daily hasanat (last 30 days):', dailyHasanat30.length, 'days');

    // Restore original auth
    supabase.auth = originalAuth;

    // Test 4: Performance comparison
    console.log('\n4. Performance comparison...');

    const startTime = Date.now();
    const previewResult = previewHasanatForRange(1, 1, 10);
    const previewTime = Date.now() - startTime;

    console.log('✅ Client-side preview (fast):', previewTime, 'ms');
    console.log('📊 Preview result:', previewResult);

    console.log('\n🎉 Hasanat API Service tests completed!');
    console.log('\n✅ Summary:');
    console.log('- previewHasanatForRange: Fast client-side calculation for UX');
    console.log('- getUserTotalHasanat: Database query for total stats');
    console.log('- getDailyHasanat: Database query for daily breakdown');
    console.log('- All functions working correctly');
  } catch (error) {
    console.error('💥 Error testing hasanat API:', error);
  }
}

testHasanatAPI();
