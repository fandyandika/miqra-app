const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying profiles and user_settings migration...\n');

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      'supabase/migrations/20250121_profiles_settings_fixed.sql',
      'utf8'
    );

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(
          `\n🔧 Executing statement ${i + 1}/${statements.length}...`
        );
        console.log(
          `SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`
        );

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} result:`, error.message);
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }

    // Test the migration by checking if tables exist
    console.log('\n🧪 Testing migration results...');

    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles table check failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table exists and accessible');
    }

    const { data: settingsCheck, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (settingsError) {
      console.log(
        '❌ User_settings table check failed:',
        settingsError.message
      );
    } else {
      console.log('✅ User_settings table exists and accessible');
    }

    // Check storage bucket
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('❌ Storage buckets check failed:', bucketsError.message);
    } else {
      const avatarsBucket = buckets?.find(b => b.id === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars storage bucket exists');
      } else {
        console.log('⚠️  Avatars storage bucket not found');
      }
    }

    console.log('\n✅ Migration application completed!');
    console.log('\n📱 Next steps:');
    console.log('1. Test profile creation with new user signup');
    console.log('2. Test avatar upload functionality');
    console.log('3. Test settings CRUD operations');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
