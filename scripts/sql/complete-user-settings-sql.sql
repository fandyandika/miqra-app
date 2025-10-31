-- Complete SQL untuk membuat user_settings table
-- Copy dan paste ini ke Supabase SQL Editor

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Privacy settings
  hasanat_visible boolean DEFAULT false,
  share_with_family boolean DEFAULT false,
  join_leaderboard boolean DEFAULT false,
  
  -- Notification settings
  daily_reminder_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '06:00:00',
  streak_warning_enabled boolean DEFAULT true,
  family_nudge_enabled boolean DEFAULT true,
  milestone_celebration_enabled boolean DEFAULT true,
  
  -- Reading preferences
  daily_goal_ayat int DEFAULT 5,
  theme text DEFAULT 'light',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT theme_check CHECK (theme IN ('light','dark','auto'))
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy
DROP POLICY IF EXISTS settings_own_rw ON public.user_settings;
CREATE POLICY settings_own_rw ON public.user_settings
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Backfill existing users
INSERT INTO public.user_settings (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_settings s 
  WHERE s.user_id = u.id
);

-- 7. Verify setup
SELECT 
  COUNT(*) as total_users,
  COUNT(s.user_id) as users_with_settings,
  COUNT(*) - COUNT(s.user_id) as users_without_settings
FROM auth.users u
LEFT JOIN public.user_settings s ON u.id = s.user_id;
