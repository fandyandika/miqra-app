-- ========================================
-- MIGRATION VERIFICATION QUERIES
-- ========================================
-- Jalankan query ini satu per satu di Supabase SQL Editor
-- untuk memverifikasi migration ayah → ayat berhasil

-- 1. CHECK COLUMN STRUCTURE
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'letter_counts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: Should show 'ayat' column (not 'ayah')

-- 2. CHECK SAMPLE DATA
-- ========================================
SELECT surah, ayat, letters
FROM public.letter_counts
ORDER BY surah, ayat
LIMIT 10;

-- Expected: Should show data with 'ayat' column

-- 3. CHECK INDEX CREATION
-- ========================================
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'letter_counts'
ORDER BY indexname;

-- Expected: Should show 'idx_letter_counts_surah_ayat' index

-- 4. TEST SUM_LETTERS FUNCTION (FIXED)
-- ========================================
-- First, apply the function fix if not done yet:
-- Run: scripts/complete-function-fix.sql

SELECT public.sum_letters(1, 1, 5) as letters_in_fatihah_1_5;

-- Expected: Should return a number > 0 (letters in Al-Fatihah verses 1-5)

-- 5. TEST WITH DIFFERENT SURAH
-- ========================================
SELECT public.sum_letters(2, 1, 10) as letters_in_baqarah_1_10;

-- Expected: Should return a number > 0 (letters in Al-Baqarah verses 1-10)

-- 6. TEST READING SESSION TRIGGER
-- ========================================
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

-- Expected:
-- - letter_count > 0
-- - hasanat_earned = letter_count * 10
-- - No errors

-- 7. TEST DAILY_HASANAT AGGREGATION
-- ========================================
-- Check if daily_hasanat was created for the test session
SELECT
  user_id,
  date,
  total_letters,
  total_hasanat,
  session_count
FROM public.daily_hasanat
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY date DESC
LIMIT 1;

-- Expected: Should show aggregated data

-- 8. CLEAN UP TEST DATA
-- ========================================
-- Remove test data
DELETE FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000';

DELETE FROM public.daily_hasanat
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 9. CHECK COMPATIBILITY VIEW
-- ========================================
SELECT surah, ayah, letters
FROM public.letter_counts_compat
ORDER BY surah, ayah
LIMIT 5;

-- Expected: Should show data with 'ayah' column (backward compatibility)

-- 10. PERFORMANCE TEST
-- ========================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT surah, ayat, letters
FROM public.letter_counts
WHERE surah = 1 AND ayat BETWEEN 1 AND 10;

-- Expected: Should use the new index for fast lookup
