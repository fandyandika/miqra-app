const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreakUpdates() {
  console.log('🧪 TESTING STREAK UPDATES...\n');

  try {
    // Get test1 user
    const { data: users } = await supabase.auth.admin.listUsers();
    const test1User = users.users.find((u) => u.email === 'test1@miqra.com');

    if (!test1User) {
      console.log('❌ test1@miqra.com not found');
      return;
    }

    console.log(`👤 Testing with user: ${test1User.email}`);

    // Get current streak
    console.log('\n1️⃣ Getting current streak...');
    const { data: currentStreak } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test1User.id)
      .single();

    console.log('📊 Current streak:', currentStreak);

    // Get checkins
    console.log('\n2️⃣ Getting checkins...');
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', test1User.id)
      .order('date', { ascending: false });

    console.log(`📊 Found ${checkins.length} checkins`);
    console.log('📊 Recent checkins:', checkins.slice(0, 3));

    // Test adding a new checkin to trigger real-time update
    console.log('\n3️⃣ Testing real-time update by adding checkin...');

    const today = new Date().toISOString().split('T')[0];
    const testCheckin = {
      user_id: test1User.id,
      date: today,
      ayat_count: 5,
    };

    // Check if checkin already exists for today
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', test1User.id)
      .eq('date', today)
      .maybeSingle();

    if (existingCheckin) {
      console.log('📅 Checkin already exists for today, updating...');
      const { data: updatedCheckin, error: updateError } = await supabase
        .from('checkins')
        .update({ ayat_count: existingCheckin.ayat_count + 5 })
        .eq('user_id', test1User.id)
        .eq('date', today)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Checkin updated:', updatedCheckin);
      }
    } else {
      console.log('📅 Creating new checkin for today...');
      const { data: newCheckin, error: insertError } = await supabase
        .from('checkins')
        .insert(testCheckin)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Insert error:', insertError.message);
      } else {
        console.log('✅ Checkin created:', newCheckin);
      }
    }

    // Wait a moment for the streak to update
    console.log('\n4️⃣ Waiting for streak update...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check updated streak
    const { data: updatedStreak } = await supabase
      .from('streaks')
      .select('current, longest, last_date')
      .eq('user_id', test1User.id)
      .single();

    console.log('📊 Updated streak:', updatedStreak);

    // Compare before and after
    console.log('\n5️⃣ Comparing streak changes...');
    console.log(
      `Before: ${currentStreak?.current || 0} current, ${currentStreak?.longest || 0} longest`
    );
    console.log(
      `After:  ${updatedStreak?.current || 0} current, ${updatedStreak?.longest || 0} longest`
    );

    if (updatedStreak?.current !== currentStreak?.current) {
      console.log('✅ Streak updated successfully!');
    } else {
      console.log('⚠️  Streak did not change (this might be expected)');
    }

    console.log('\n🎉 STREAK UPDATE TEST COMPLETED!');
    console.log('💡 Check the app to see if Home and Profile screens show updated streak');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreakUpdates();
