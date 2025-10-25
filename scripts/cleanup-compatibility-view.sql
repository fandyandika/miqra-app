-- Cleanup: Remove compatibility view after successful migration
-- Run this in Supabase SQL Editor

-- Remove the compatibility view since all code now uses 'ayat'
DROP VIEW IF EXISTS public.letter_counts_compat;

-- Verify the view is removed
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'letter_counts_compat';

-- Expected: No rows returned (view is deleted)
