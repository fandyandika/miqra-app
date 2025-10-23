const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestData() {
  try {
    console.log('🌱 Starting data seeding...');

    // Step 1: Get actual user IDs from profiles table (which references auth.users)
    console.log('📋 Querying profiles for test users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(2);

    if (usersError) {
      console.error('❌ Error querying users:', usersError.message);
      return;
    }

    if (!users || users.length < 2) {
      console.error('❌ Need at least 2 users in profiles for seeding');
      console.log('Available users:', users);
      console.log('Please create 2 user profiles first in Supabase Dashboard');
      return;
    }

    const USER_A = users[0].user_id;
    const USER_B = users[1].user_id;

    console.log('✅ Found users:');
    console.log(`  USER_A: ${USER_A}`);
    console.log(`  USER_B: ${USER_B}`);

    // Step 2: Insert family by USER_A
    console.log('🏠 Creating family...');
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: 'Miqra Test Family',
        created_by: USER_A,
      })
      .select('id')
      .single();

    if (familyError) {
      console.error('❌ Error creating family:', familyError.message);
      return;
    }

    const FAMILY_ID = family.id;
    console.log(`✅ Family created with ID: ${FAMILY_ID}`);

    // Step 3: Insert family members
    console.log('👥 Adding family members...');
    const { error: membersError } = await supabase
      .from('family_members')
      .insert([
        { family_id: FAMILY_ID, user_id: USER_A, role: 'owner' },
        { family_id: FAMILY_ID, user_id: USER_B, role: 'member' },
      ]);

    if (membersError) {
      console.error('❌ Error creating family members:', membersError.message);
      return;
    }

    console.log('✅ Family members added:');
    console.log(`  - User ${USER_A} (owner)`);
    console.log(`  - User ${USER_B} (member)`);

    // Step 4: Insert checkin for owner
    console.log('📝 Adding checkin for owner...');
    const today = new Date().toISOString().split('T')[0];

    // Check if checkin already exists
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', USER_A)
      .eq('date', today)
      .single();

    if (existingCheckin) {
      console.log(
        `✅ Checkin already exists for User ${USER_A}: ${today} (5 ayat)`
      );
    } else {
      const { error: checkinError } = await supabase.from('checkins').insert({
        user_id: USER_A,
        date: today,
        ayat_count: 5,
      });

      if (checkinError) {
        console.error('❌ Error creating checkin:', checkinError.message);
        return;
      }

      console.log(`✅ Checkin created for User ${USER_A}: ${today} (5 ayat)`);
    }

    // Step 5: Update streak
    console.log('🔥 Updating streak...');
    const { error: streakError } = await supabase.rpc(
      'update_streak_after_checkin',
      {
        checkin_user_id: USER_A,
        checkin_date: today,
      }
    );

    if (streakError) {
      console.error('❌ Error updating streak:', streakError.message);
      return;
    }

    console.log('✅ Streak updated');

    // Report final results
    console.log('\n📊 SEEDING COMPLETE:');
    console.log(`  - Family ID: ${FAMILY_ID}`);
    console.log(`  - Family members: 2 rows inserted`);
    console.log(`  - Checkin: 1 row inserted for ${today}`);
    console.log(`  - Streak: Updated for user ${USER_A}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedTestData();
