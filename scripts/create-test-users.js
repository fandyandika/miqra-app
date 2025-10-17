const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  try {
    console.log('👤 Creating test users...');
    
    // Create test users using Supabase Auth Admin API
    const testUsers = [
      {
        email: 'test1@miqra.com',
        password: 'password123',
        email_confirm: true
      },
      {
        email: 'test2@miqra.com', 
        password: 'password123',
        email_confirm: true
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of testUsers) {
      console.log(`📝 Creating user: ${userData.email}`);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm
      });
      
      if (authError) {
        console.error(`❌ Error creating user ${userData.email}:`, authError.message);
        continue;
      }
      
      console.log(`✅ User created: ${authData.user.id}`);
      createdUsers.push(authData.user);
      
      // Create profile for the user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          display_name: userData.email.split('@')[0],
          timezone: 'Asia/Jakarta'
        });
      
      if (profileError) {
        console.error(`❌ Error creating profile for ${userData.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile created for: ${userData.email}`);
      }
    }
    
    console.log(`\n📊 Test users created: ${createdUsers.length}`);
    console.log('You can now run: node scripts/seed-test-data.js');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  }
}

createTestUsers();
