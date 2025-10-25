-- Fix sum_letters function to use 'ayat' instead of 'ayah'
-- Run this in Supabase SQL Editor

BEGIN;

-- Fix sum_letters function to use 'ayat' instead of 'ayah'
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

COMMIT;
