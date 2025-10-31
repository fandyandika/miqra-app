# 🔍 Migration Verification Steps

## Step 1: Apply Migration

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan migration SQL:

```sql
BEGIN;

-- Rename column ayah to ayat for consistency with other tables
ALTER TABLE public.letter_counts
  RENAME COLUMN ayah TO ayat;

-- Create index for fast lookup performance
CREATE INDEX IF NOT EXISTS idx_letter_counts_surah_ayat
  ON public.letter_counts (surah, ayat);

-- Optional: compatibility view (delete later after code migration)
CREATE OR REPLACE VIEW public.letter_counts_compat AS
SELECT
  surah,
  ayat AS ayah,
  letters
FROM public.letter_counts;

COMMIT;
```

## Step 2: Verify Data Structure

Jalankan query ini di SQL Editor:

```sql
-- Check column names
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'letter_counts'
AND table_schema = 'public';

-- Check sample data
SELECT * FROM public.letter_counts LIMIT 5;

-- Check index creation
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'letter_counts';
```

**Expected Results:**

- ✅ Column `ayat` exists (not `ayah`)
- ✅ Sample data shows `ayat` column
- ✅ Index `idx_letter_counts_surah_ayat` exists

## Step 3: Test Functions

Jalankan query ini untuk test sum_letters function:

```sql
-- Test sum_letters function
SELECT public.sum_letters(1, 1, 5) as letters_in_fatihah_1_5;

-- Test with different surah
SELECT public.sum_letters(2, 1, 10) as letters_in_baqarah_1_10;
```

**Expected Results:**

- ✅ Function returns number > 0
- ✅ No errors in function execution

## Step 4: Test Reading Session Trigger

Jalankan query ini untuk test trigger:

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
SELECT letter_count, hasanat_earned
FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Clean up
DELETE FROM public.reading_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

**Expected Results:**

- ✅ `letter_count` > 0
- ✅ `hasanat_earned` = letter_count \* 10
- ✅ No errors during insert/delete

## Step 5: Test App Integration

1. Buka aplikasi Miqra
2. Catat bacaan baru (minimal 1 ayat)
3. Check apakah hasanat terhitung dengan benar
4. Check halaman Progress/Stats

**Expected Results:**

- ✅ Hasanat terhitung otomatis
- ✅ Tidak ada error di console
- ✅ Data tersimpan dengan benar

## Step 6: Remove Compatibility View (Optional)

Setelah semua test berhasil, hapus view compatibility:

```sql
DROP VIEW IF EXISTS public.letter_counts_compat;
```

## ✅ Success Criteria

- [ ] Migration applied successfully
- [ ] Column renamed from `ayah` to `ayat`
- [ ] Index created successfully
- [ ] Functions work correctly
- [ ] Triggers work correctly
- [ ] App integration works
- [ ] No data loss
- [ ] No breaking changes
