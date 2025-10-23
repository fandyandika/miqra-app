const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache() {
  try {
    console.log('🧹 Clearing cache and verifying data...\n');

    // 1. Verify Supabase is clean
    console.log('1. Verifying Supabase data...');
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (familiesError) {
      console.error('❌ Error checking families:', familiesError);
      return;
    }

    console.log(`   Found ${families.length} families in Supabase`);
    if (families.length > 0) {
      families.forEach((family, index) => {
        console.log(`   ${index + 1}. "${family.name}" (${family.id})`);
      });
    } else {
      console.log('   ✅ Supabase is clean - no families found');
    }

    // 2. Check family memberships
    console.log('\n2. Checking family memberships...');
    const { data: memberships, error: membersError } = await supabase
      .from('family_members')
      .select('family_id, user_id, role, families(id, name)')
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Error checking memberships:', membersError);
      return;
    }

    console.log(`   Found ${memberships.length} memberships in Supabase`);
    if (memberships.length > 0) {
      memberships.forEach((membership, index) => {
        console.log(
          `   ${index + 1}. User ${membership.user_id} in "${membership.families?.name || 'Unknown'}"`
        );
      });
    } else {
      console.log('   ✅ Supabase is clean - no memberships found');
    }

    console.log('\n💡 Next steps:');
    console.log('1. Restart your Expo Go app completely');
    console.log('2. Or clear React Query cache in the app');
    console.log('3. The duplicate families should disappear');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearCache();
