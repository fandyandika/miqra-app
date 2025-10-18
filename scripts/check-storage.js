const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  try {
    console.log('🔍 Checking storage for cached data...\n');

    // Check if there's any cached data in Supabase
    console.log('📋 Checking for any cached family data...');
    
    // Try to get any data that might be cached
    const { data: cachedData, error: cacheError } = await supabase
      .from('family_members')
      .select(`
        family_id, 
        user_id,
        role, 
        created_at,
        families(id, name, created_by)
      `)
      .limit(10);

    if (cacheError) {
      console.log('❌ Error checking cache:', cacheError.message);
    } else {
      console.log(`Found ${cachedData?.length || 0} cached family memberships`);
      if (cachedData && cachedData.length > 0) {
        cachedData.forEach((item, index) => {
          console.log(`${index + 1}. Family: "${item.families?.name || 'Unknown'}"`);
          console.log(`   User: ${item.user_id}`);
          console.log(`   Role: ${item.role}`);
        });
      }
    }

    // Check if there are any profiles that might have family data
    console.log('\n👤 Checking profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .limit(10);

    if (profilesError) {
      console.log('❌ Error checking profiles:', profilesError.message);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`${index + 1}. User: ${profile.user_id}`);
          console.log(`   Name: ${profile.display_name || 'No name'}`);
          console.log(`   Created: ${profile.created_at}`);
        });
      }
    }

    // Check if there are any checkins that might indicate user activity
    console.log('\n📊 Checking checkins...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('user_id, date, ayat_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (checkinsError) {
      console.log('❌ Error checking checkins:', checkinsError.message);
    } else {
      console.log(`Found ${checkins?.length || 0} checkins`);
      if (checkins && checkins.length > 0) {
        checkins.forEach((checkin, index) => {
          console.log(`${index + 1}. User: ${checkin.user_id}`);
          console.log(`   Date: ${checkin.date}`);
          console.log(`   Ayat: ${checkin.ayat_count}`);
        });
      }
    }

    console.log('\n💡 Possible causes for duplicate families in UI:');
    console.log('1. React Query cache contains old data');
    console.log('2. Local storage/AsyncStorage has cached data');
    console.log('3. App state management has stale data');
    console.log('4. Mock/test data is being used in development');
    console.log('5. Database has data but RLS policies are hiding it');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStorage();
