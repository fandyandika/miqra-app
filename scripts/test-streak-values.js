const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreakValues() {
  console.log('🧪 Testing different streak values...\n');

  try {
    // Get test user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ No users found. Run seed script first.');
      return;
    }

    const userId = profiles[0].user_id;
    console.log(`👤 Using user: ${userId}`);

    // Test different streak scenarios
    const testCases = [
      { name: 'Sprout (1-2 days)', current: 1, last_date: '2025-10-17' },
      { name: 'Sapling (3-9 days)', current: 5, last_date: '2025-10-13' },
      { name: 'Young (10-29 days)', current: 15, last_date: '2025-10-03' },
      { name: 'Mature (30-99 days)', current: 50, last_date: '2025-08-29' },
      { name: 'Ancient (100+ days)', current: 120, last_date: '2025-06-20' },
      { name: 'Broke Yesterday', current: 5, last_date: '2025-10-16' }, // 2 days ago
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Testing: ${testCase.name}`);
      
      // Update streak
      const { error: streakError } = await supabase
        .from('streaks')
        .upsert({
          user_id: userId,
          current: testCase.current,
          longest: Math.max(testCase.current, 10),
          last_date: testCase.last_date
        });

      if (streakError) {
        console.error(`❌ Error updating streak:`, streakError);
        continue;
      }

      console.log(`✅ Streak updated: ${testCase.current} days, last: ${testCase.last_date}`);
      
      // Test didBreakYesterday function
      const { didBreakYesterday } = require('../src/lib/streak');
      const broke = didBreakYesterday(testCase.last_date, 'Asia/Jakarta');
      console.log(`🌱 Broke yesterday: ${broke ? 'Yes' : 'No'}`);
      
      // Show expected tree stage
      const { getTreeStage } = require('../src/lib/streak');
      const stage = getTreeStage(testCase.current);
      console.log(`🌳 Tree stage: ${stage}`);
      
      // Show expected emoji
      const emojiMap = {
        sprout: '🌱',
        sapling: '🌿', 
        young: '🌳',
        mature: '🌲',
        ancient: '🌲'
      };
      console.log(`🎨 Expected emoji: ${emojiMap[stage]}`);
    }

    console.log('\n✅ All streak tests completed!');
    console.log('\n📱 Now test in the app:');
    console.log('1. Login with test1@miqra.com / password123');
    console.log('2. Check TreeView in HomeScreen');
    console.log('3. Tap TreeView to open full screen modal');
    console.log('4. Try different streak values by running this script again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreakValues();
