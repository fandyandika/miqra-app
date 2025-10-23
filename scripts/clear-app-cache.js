require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearTestData() {
  console.log('🧹 Clearing test data...');

  try {
    // Clear checkins
    const { error: checkinError } = await supabase
      .from('checkins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (checkinError) {
      console.error('❌ Error clearing checkins:', checkinError);
    } else {
      console.log('✅ Checkins cleared');
    }

    // Clear streaks
    const { error: streakError } = await supabase
      .from('streaks')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (streakError) {
      console.error('❌ Error clearing streaks:', streakError);
    } else {
      console.log('✅ Streaks cleared');
    }

    // Clear families (optional - be careful!)
    const { error: familyError } = await supabase
      .from('families')
      .delete()
      .like('name', '%Test%');

    if (familyError) {
      console.error('❌ Error clearing test families:', familyError);
    } else {
      console.log('✅ Test families cleared');
    }

    console.log('🎉 Test data cleared successfully!');
    console.log('📱 Now restart the app to see clean state');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

clearTestData();
