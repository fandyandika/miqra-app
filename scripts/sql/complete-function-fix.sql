-- Complete fix for all functions after ayah → ayat migration
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Fix sum_letters function to use 'ayat' instead of 'ayah'
CREATE OR REPLACE FUNCTION public.sum_letters(p_surah INT, p_start INT, p_end INT)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(letters), 0)
  FROM public.letter_counts
  WHERE surah = p_surah
    AND ayat BETWEEN p_start AND p_end;
$$;

-- 2. Verify the function works
SELECT public.sum_letters(1, 1, 5) as test_fatihah_1_5;

-- 3. Test with different surah
SELECT public.sum_letters(2, 1, 10) as test_baqarah_1_10;

COMMIT;
