-- Backfill Hasanat System
-- Hitung ulang letter_count & hasanat_earned untuk semua sesi yang belum dihitung

UPDATE public.reading_sessions rs
SET
  letter_count = public.sum_letters(rs.surah_number, rs.ayat_start, rs.ayat_end),
  hasanat_earned = public.sum_letters(rs.surah_number, rs.ayat_start, rs.ayat_end) * 10
WHERE
  (rs.letter_count IS NULL OR rs.letter_count = 0)
  OR (rs.hasanat_earned IS NULL OR rs.hasanat_earned = 0);

-- Rebuild daily_hasanat untuk semua user
DELETE FROM public.daily_hasanat;

INSERT INTO public.daily_hasanat (user_id, date, total_letters, total_hasanat, session_count, created_at, updated_at)
SELECT
  rs.user_id,
  public.session_local_date(rs.user_id, rs.session_time) AS date,
  SUM(rs.letter_count) AS total_letters,
  SUM(rs.hasanat_earned) AS total_hasanat,
  COUNT(*) AS session_count,
  NOW(), NOW()
FROM public.reading_sessions rs
WHERE rs.letter_count > 0 AND rs.hasanat_earned > 0
GROUP BY rs.user_id, public.session_local_date(rs.user_id, rs.session_time);

-- Log hasil backfill
DO $$
DECLARE
  session_count INT;
  daily_count INT;
  total_hasanat BIGINT;
BEGIN
  SELECT COUNT(*) INTO session_count FROM public.reading_sessions WHERE hasanat_earned > 0;
  SELECT COUNT(*) INTO daily_count FROM public.daily_hasanat;
  SELECT COALESCE(SUM(total_hasanat), 0) INTO total_hasanat FROM public.daily_hasanat;

  RAISE NOTICE 'Backfill completed:';
  RAISE NOTICE '  Sessions with hasanat: %', session_count;
  RAISE NOTICE '  Daily hasanat records: %', daily_count;
  RAISE NOTICE '  Total hasanat earned: %', total_hasanat;
END $$;
