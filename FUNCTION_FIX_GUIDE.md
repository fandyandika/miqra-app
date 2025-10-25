# 🔧 Function Fix Guide

## Fix sum_letters function after ayah → ayat migration

**Problem:** Function `sum_letters` masih menggunakan kolom `ayah` yang sudah di-rename ke `ayat`

**Error:** `ERROR: 42703: column "ayah" does not exist`

---

## 🚀 Quick Fix

### Step 1: Apply Function Fix

Jalankan SQL ini di Supabase SQL Editor:

```sql
-- Complete fix for all functions after ayah → ayat migration
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

-- Test the function
SELECT public.sum_letters(1, 1, 5) as test_fatihah_1_5;
SELECT public.sum_letters(2, 1, 10) as test_baqarah_1_10;

COMMIT;
```

### Step 2: Verify Fix

Jalankan query ini untuk memastikan function bekerja:

```sql
-- Test sum_letters function
SELECT public.sum_letters(1, 1, 5) as letters_in_fatihah_1_5;

-- Expected: Should return a number > 0
```

### Step 3: Test Reading Session

Jalankan test reading session untuk memastikan trigger bekerja:

```sql
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
  hasanat_earned
FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up
DELETE FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

---

## ✅ Expected Results

After applying the fix:

1. **Function Test:**
   - `sum_letters(1, 1, 5)` returns number > 0
   - `sum_letters(2, 1, 10)` returns number > 0
   - No errors

2. **Reading Session Test:**
   - `letter_count` > 0
   - `hasanat_earned` = letter_count \* 10
   - No errors during insert

3. **App Integration:**
   - Hasanat calculations work in app
   - No console errors
   - Data saves correctly

---

## 📁 Files Created

- `scripts/complete-function-fix.sql` - Complete function fix
- `scripts/apply-function-fix.sql` - Simple function fix
- Updated `scripts/verify-migration-queries.sql` - Updated verification

---

## 🎯 Status

**✅ READY TO APPLY FUNCTION FIX**

Jalankan `scripts/complete-function-fix.sql` di Supabase SQL Editor untuk memperbaiki function.
