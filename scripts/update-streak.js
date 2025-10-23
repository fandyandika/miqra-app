const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStreak() {
  console.log('🔄 Updating streak for testing...\n');

  try {
    // Get user ID from auth (you need to be logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ No user logged in. Please login first in the app.');
      console.log('📱 Steps:');
      console.log('1. Open the app');
      console.log('2. Login with test1@miqra.com / password123');
      console.log('3. Run this script again');
      return;
    }

    console.log(`👤 Updating streak for user: ${user.email}`);

    // Update streak to different values for testing
    const testStreaks = [
      { name: 'Sprout (1 day)', current: 1, last_date: '2025-10-17' },
      { name: 'Sapling (5 days)', current: 5, last_date: '2025-10-13' },
      { name: 'Young (15 days)', current: 15, last_date: '2025-10-03' },
      { name: 'Mature (50 days)', current: 50, last_date: '2025-08-29' },
      { name: 'Ancient (120 days)', current: 120, last_date: '2025-06-20' },
    ];

    console.log('\n📊 Available test scenarios:');
    testStreaks.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.name} - ${scenario.current} days`);
    });

    // For now, let's set to sapling (5 days)
    const selectedStreak = testStreaks[1]; // Sapling

    const { error } = await supabase.from('streaks').upsert({
      user_id: user.id,
      current: selectedStreak.current,
      longest: Math.max(selectedStreak.current, 10),
      last_date: selectedStreak.last_date,
    });

    if (error) {
      console.error('❌ Error updating streak:', error);
      return;
    }

    console.log(`\n✅ Streak updated to: ${selectedStreak.name}`);
    console.log(`   Current: ${selectedStreak.current} days`);
    console.log(`   Last date: ${selectedStreak.last_date}`);
    console.log(`   Expected emoji: 🌿 (sapling)`);

    console.log('\n📱 Now refresh the app to see the changes!');
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateStreak();
