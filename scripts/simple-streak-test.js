const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreak() {
  console.log('🧪 Testing streak functionality...\n');

  try {
    // Test the streak functions directly
    const { didBreakYesterday, getTreeStage, getTreeVisual } = require('../src/lib/streak');

    console.log('📊 Testing streak functions:');

    // Test different scenarios
    const scenarios = [
      { name: 'Sprout (1 day)', days: 1, lastDate: '2025-10-17' },
      { name: 'Sapling (5 days)', days: 5, lastDate: '2025-10-13' },
      { name: 'Young (15 days)', days: 15, lastDate: '2025-10-03' },
      { name: 'Mature (50 days)', days: 50, lastDate: '2025-08-29' },
      { name: 'Ancient (120 days)', days: 120, lastDate: '2025-06-20' },
      { name: 'Broke Yesterday', days: 5, lastDate: '2025-10-16' }, // 2 days ago
    ];

    scenarios.forEach((scenario) => {
      console.log(`\n🌱 ${scenario.name}:`);
      console.log(`   Days: ${scenario.days}`);
      console.log(`   Last date: ${scenario.lastDate}`);

      const broke = didBreakYesterday(scenario.lastDate, 'Asia/Jakarta');
      console.log(`   Broke yesterday: ${broke ? 'Yes' : 'No'}`);

      const stage = getTreeStage(scenario.days);
      console.log(`   Tree stage: ${stage}`);

      const visual = getTreeVisual({
        currentStreakDays: scenario.days,
        brokeYesterday: broke,
      });
      console.log(`   Visual: ${visual.stage} (${visual.variant})`);

      // Show expected emoji
      const emojiMap = {
        sprout: '🌱',
        sapling: '🌿',
        young: '🌳',
        mature: '🌲',
        ancient: '🌲',
      };
      console.log(`   Emoji: ${emojiMap[stage]}`);
    });

    console.log('\n✅ Streak function tests completed!');
    console.log('\n📱 To test in the app:');
    console.log('1. Start the app: npx expo start');
    console.log('2. Login with test1@miqra.com / password123');
    console.log('3. Check TreeView in HomeScreen');
    console.log('4. Tap TreeView to open full screen modal');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreak();
