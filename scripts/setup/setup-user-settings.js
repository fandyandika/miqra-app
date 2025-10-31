require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

async function setupUserSettings() {
  console.log('🚀 SETTING UP USER_SETTINGS TABLE...\n');

  try {
    // Create user_settings table
    console.log('📋 Creating user_settings table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_settings (
        user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Privacy
        hasanat_visible boolean DEFAULT false,
        share_with_family boolean DEFAULT false,
        join_leaderboard boolean DEFAULT false,
        
        -- Notifications
        daily_reminder_enabled boolean DEFAULT true,
        reminder_time time DEFAULT '06:00:00',
        streak_warning_enabled boolean DEFAULT true,
        family_nudge_enabled boolean DEFAULT true,
        milestone_celebration_enabled boolean DEFAULT true,
        
        -- Reading preferences
        daily_goal_ayat int DEFAULT 5,
        theme text DEFAULT 'light',
        
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        
        CONSTRAINT theme_check CHECK (theme IN ('light','dark','auto'))
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL,
    });

    if (createError) {
      console.error('❌ Create table error:', createError);
      return;
    }

    console.log('✅ user_settings table created');

    // Enable RLS
    console.log('🔒 Enabling RLS...');

    const rlsSQL = `
      ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS settings_own_rw ON public.user_settings;
      CREATE POLICY settings_own_rw ON public.user_settings
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });

    if (rlsError) {
      console.error('❌ RLS error:', rlsError);
      return;
    }

    console.log('✅ RLS policies applied');

    // Create updated_at trigger
    console.log('⚡ Creating updated_at trigger...');

    const triggerSQL = `
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
      CREATE TRIGGER set_updated_at_user_settings
      BEFORE UPDATE ON public.user_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: triggerSQL,
    });

    if (triggerError) {
      console.error('❌ Trigger error:', triggerError);
      return;
    }

    console.log('✅ Updated_at trigger created');

    // Backfill existing users
    console.log('👥 Backfilling existing users...');

    const backfillSQL = `
      INSERT INTO public.user_settings (user_id)
      SELECT u.id
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 
        FROM public.user_settings s 
        WHERE s.user_id = u.id
      );
    `;

    const { error: backfillError } = await supabase.rpc('exec_sql', {
      sql: backfillSQL,
    });

    if (backfillError) {
      console.error('❌ Backfill error:', backfillError);
      return;
    }

    console.log('✅ Existing users backfilled');

    // Verify setup
    console.log('\n🔍 Verifying setup...');

    const { data: count, error: countError } = await supabase
      .from('user_settings')
      .select('user_id', { count: 'exact' });

    if (countError) {
      console.error('❌ Count error:', countError);
      return;
    }

    console.log(`✅ Found ${count.length} user_settings records`);

    console.log('\n🎉 SETUP COMPLETED SUCCESSFULLY!');
    console.log('✅ user_settings table created');
    console.log('✅ RLS policies applied');
    console.log('✅ Triggers created');
    console.log('✅ Users backfilled');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupUserSettings();
