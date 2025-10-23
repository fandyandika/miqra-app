const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFamilyDuplicates() {
  try {
    console.log('🔍 Debugging family duplicates...\n');

    // Check all families
    console.log('📋 All families in database:');
    const { data: allFamilies, error: familiesError } = await supabase
      .from('families')
      .select('id, name, created_by, created_at')
      .order('created_at', { ascending: false });

    if (familiesError) {
      console.error('❌ Error fetching families:', familiesError);
      return;
    }

    console.log(`Found ${allFamilies.length} families:`);
    allFamilies.forEach((family, index) => {
      console.log(`${index + 1}. ID: ${family.id}`);
      console.log(`   Name: "${family.name}"`);
      console.log(`   Created by: ${family.created_by}`);
      console.log(`   Created at: ${family.created_at}`);
      console.log('');
    });

    // Check family_members for all families
    console.log('👥 All family memberships:');
    const { data: allMemberships, error: membersError } = await supabase
      .from('family_members')
      .select(
        `
        family_id, 
        user_id,
        role, 
        created_at,
        families(id, name, created_by)
      `
      )
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Error fetching memberships:', membersError);
      return;
    }

    console.log(`Found ${allMemberships.length} memberships:`);
    allMemberships.forEach((membership, index) => {
      console.log(
        `${index + 1}. Family: "${membership.families?.name || 'Unknown'}" (${membership.family_id})`
      );
      console.log(`   User: ${membership.user_id}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Joined: ${membership.created_at}`);
      console.log('');
    });

    // Check for duplicates by name
    const familyNames = allFamilies.map((f) => f.name);
    const uniqueNames = [...new Set(familyNames)];

    console.log('🔍 Duplicate analysis:');
    console.log(`Total families: ${allFamilies.length}`);
    console.log(`Unique names: ${uniqueNames.length}`);

    if (allFamilies.length !== uniqueNames.length) {
      console.log('⚠️  DUPLICATES FOUND!');

      uniqueNames.forEach((name) => {
        const familiesWithName = allFamilies.filter((f) => f.name === name);
        if (familiesWithName.length > 1) {
          console.log(`\n📌 Name "${name}" appears ${familiesWithName.length} times:`);
          familiesWithName.forEach((f) => {
            console.log(`   - ID: ${f.id}`);
            console.log(`   - Created by: ${f.created_by}`);
            console.log(`   - Created at: ${f.created_at}`);
          });
        }
      });
    } else {
      console.log('✅ No duplicate family names found');
    }

    // Check for duplicate memberships (same user in same family)
    console.log('\n🔍 Duplicate membership analysis:');
    const membershipKeys = allMemberships.map((m) => `${m.user_id}-${m.family_id}`);
    const uniqueMemberships = [...new Set(membershipKeys)];

    console.log(`Total memberships: ${allMemberships.length}`);
    console.log(`Unique memberships: ${uniqueMemberships.length}`);

    if (allMemberships.length !== uniqueMemberships.length) {
      console.log('⚠️  DUPLICATE MEMBERSHIPS FOUND!');

      const membershipCounts = {};
      allMemberships.forEach((m) => {
        const key = `${m.user_id}-${m.family_id}`;
        membershipCounts[key] = (membershipCounts[key] || 0) + 1;
      });

      Object.entries(membershipCounts).forEach(([key, count]) => {
        if (count > 1) {
          const [userId, familyId] = key.split('-');
          const family = allFamilies.find((f) => f.id === familyId);
          console.log(
            `   - User ${userId} in family "${family?.name}" (${familyId}) appears ${count} times`
          );
        }
      });
    } else {
      console.log('✅ No duplicate memberships found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFamilyDuplicates();
