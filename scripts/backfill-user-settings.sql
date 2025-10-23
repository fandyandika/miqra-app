-- Backfill SQL untuk user lama yang belum punya user_settings
-- Jalankan sekali di Supabase SQL Editor

-- Insert default user_settings untuk semua user yang belum punya
INSERT INTO public.user_settings (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_settings s 
  WHERE s.user_id = u.id
);

-- Verifikasi hasil backfill
SELECT 
  COUNT(*) as total_users,
  COUNT(s.user_id) as users_with_settings,
  COUNT(*) - COUNT(s.user_id) as users_without_settings
FROM auth.users u
LEFT JOIN public.user_settings s ON u.id = s.user_id;
