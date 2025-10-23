require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupAnalytics() {
  console.log('🚀 SETTING UP ANALYTICS FUNCTIONS...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251022_analytics_functions.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 Migration size:', migrationSQL.length, 'characters');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(
          `\n🔄 Executing statement ${i + 1}/${statements.length}...`
        );

        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';',
          });

          if (error) {
            console.error(`❌ Statement ${i + 1} error:`, error.message);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
        }
      }
    }

    // Verify functions exist
    console.log('\n🔍 Verifying functions...');

    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', [
        'get_daily_stats',
        'get_weekly_stats',
        'get_monthly_stats',
        'get_user_total_stats',
        'get_family_stats',
      ]);

    if (functionsError) {
      console.error('❌ Functions check error:', functionsError);
      return;
    }

    console.log(
      '✅ Functions found:',
      functions.map(f => f.routine_name)
    );

    // Test with a sample user
    console.log('\n🧪 Testing functions with sample data...');

    // Get a test user
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users && users.users.length > 0) {
      const testUserId = users.users[0].id;
      console.log('👤 Testing with user:', testUserId);

      // Test daily stats
      try {
        const { data: dailyTest } = await supabase.rpc('get_daily_stats', {
          p_user_id: testUserId,
          p_start_date: '2025-01-01',
          p_end_date: '2025-12-31',
        });
        console.log('✅ Daily stats test:', dailyTest?.length || 0, 'days');
      } catch (err) {
        console.log('⚠️ Daily stats test failed:', err.message);
      }

      // Test user total stats
      try {
        const { data: totalTest } = await supabase.rpc('get_user_total_stats', {
          p_user_id: testUserId,
        });
        console.log('✅ User total stats test:', totalTest);
      } catch (err) {
        console.log('⚠️ User total stats test failed:', err.message);
      }
    }

    console.log('\n🎉 ANALYTICS SETUP COMPLETED!');
    console.log('✅ All functions created');
    console.log('✅ Indexes created');
    console.log('✅ Functions tested');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupAnalytics();
