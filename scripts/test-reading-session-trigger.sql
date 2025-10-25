-- Test reading session trigger after function fix
-- Run this in Supabase SQL Editor

-- Insert test reading session
INSERT INTO public.reading_sessions (
  user_id,
  surah_number,
  ayat_start,
  ayat_end,
  session_time
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  1,
  1,
  3,
  NOW()
);

-- Check if trigger worked
SELECT
  surah_number,
  ayat_start,
  ayat_end,
  letter_count,
  hasanat_earned,
  created_at
FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC
LIMIT 1;

-- Expected results:
-- - letter_count > 0
-- - hasanat_earned = letter_count * 10
-- - No errors

-- Clean up test data
DELETE FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000';
