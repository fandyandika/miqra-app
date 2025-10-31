import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyHasanatVisibleMigration() {
  console.log('🔧 Applying hasanat_visible migration...');

  try {
    // Read migration SQL
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20250125_add_hasanat_visible_setting.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(migrationSql);

    // Apply migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('❌ Migration error:', error.message);

      // Try direct SQL execution
      console.log('🔄 Trying direct SQL execution...');

      // Add column
      const { error: addColumnError } = await supabase
        .from('profiles')
        .select('hasanat_visible')
        .limit(1);

      if (
        addColumnError &&
        addColumnError.message.includes('column "hasanat_visible" does not exist')
      ) {
        console.log('✅ Column does not exist, need to add it manually');
        console.log('📋 Please run this SQL in Supabase dashboard:');
        console.log('');
        console.log(
          'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hasanat_visible BOOLEAN DEFAULT false;'
        );
        console.log(
          "COMMENT ON COLUMN public.profiles.hasanat_visible IS 'Whether user wants to see hasanat features in UI';"
        );
        console.log(
          'UPDATE public.profiles SET hasanat_visible = false WHERE hasanat_visible IS NULL;'
        );
        console.log('');
        return;
      }
    } else {
      console.log('✅ Migration applied successfully');
    }

    // Test the migration
    console.log('\n🧪 Testing migration...');

    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('user_id, hasanat_visible')
      .limit(1);

    if (testError) {
      console.error('❌ Test error:', testError.message);
    } else {
      console.log('✅ Migration test successful:', testData);
    }

    console.log('\n🎉 Hasanat visible migration completed!');
  } catch (error) {
    console.error('💥 Error applying migration:', error);
  }
}

applyHasanatVisibleMigration();
