const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFamilies() {
  try {
    console.log('🔍 Checking families data...\n');

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    console.log('👤 Current user:', user.email);

    // Check families table
    console.log('\n📋 All families in database:');
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
      console.log(`   Name: ${family.name}`);
      console.log(`   Created by: ${family.created_by}`);
      console.log(`   Created at: ${family.created_at}`);
      console.log('');
    });

    // Check family_members for current user
    console.log('👥 Family members for current user:');
    const { data: myMemberships, error: membersError } = await supabase
      .from('family_members')
      .select(
        `
        family_id, 
        role, 
        created_at,
        families(id, name, created_by)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Error fetching memberships:', membersError);
      return;
    }

    console.log(`Found ${myMemberships.length} memberships:`);
    myMemberships.forEach((membership, index) => {
      console.log(`${index + 1}. Family ID: ${membership.family_id}`);
      console.log(`   Family Name: ${membership.families?.name || 'Unknown'}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Joined at: ${membership.created_at}`);
      console.log('');
    });

    // Check for duplicates
    const familyNames = allFamilies.map(f => f.name);
    const duplicates = familyNames.filter(
      (name, index) => familyNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICATE FAMILY NAMES FOUND:');
      duplicates.forEach(name => {
        const duplicateFamilies = allFamilies.filter(f => f.name === name);
        console.log(`   "${name}" appears ${duplicateFamilies.length} times:`);
        duplicateFamilies.forEach(f => {
          console.log(`     - ID: ${f.id}, Created: ${f.created_at}`);
        });
      });
    } else {
      console.log('✅ No duplicate family names found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFamilies();
