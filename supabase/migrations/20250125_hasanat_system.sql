-- Hasanat System Migration
-- 1) Reference table: letter_counts (huruf per ayat)
CREATE TABLE IF NOT EXISTS public.letter_counts (
  surah INT NOT NULL,
  ayah  INT NOT NULL,
  letters INT NOT NULL,
  PRIMARY KEY (surah, ayah)
);

-- RLS (read-only utk user; write via migration/seed)
ALTER TABLE public.letter_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS letter_counts_select_all ON public.letter_counts;
CREATE POLICY letter_counts_select_all
  ON public.letter_counts
  FOR SELECT
  USING (true);

-- 2) Tambah kolom pada reading_sessions
ALTER TABLE public.reading_sessions
  ADD COLUMN IF NOT EXISTS letter_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasanat_earned INT DEFAULT 0;

-- 3) Tabel agregasi harian
CREATE TABLE IF NOT EXISTS public.daily_hasanat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_letters INT NOT NULL DEFAULT 0,
  total_hasanat INT NOT NULL DEFAULT 0,
  session_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_hasanat_user_date
  ON public.daily_hasanat(user_id, date DESC);

ALTER TABLE public.daily_hasanat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_hasanat_own_rw ON public.daily_hasanat;
CREATE POLICY daily_hasanat_own_rw
  ON public.daily_hasanat
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) Helper: ambil timezone user (default Asia/Jakarta)
CREATE OR REPLACE FUNCTION public.user_timezone(p_user UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((SELECT timezone FROM public.profiles WHERE id = p_user), 'Asia/Jakarta');
$$;

-- 5) Helper: normalisasi tanggal sesi sesuai timezone user
CREATE OR REPLACE FUNCTION public.session_local_date(p_user UUID, p_ts TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT (p_ts AT TIME ZONE user_timezone(p_user))::date;
$$;

-- 6) Sum huruf untuk range ayat dari table letter_counts
CREATE OR REPLACE FUNCTION public.sum_letters(p_surah INT, p_start INT, p_end INT)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(letters), 0)
  FROM public.letter_counts
  WHERE surah = p_surah
    AND ayah BETWEEN p_start AND p_end;
$$;

-- 7) BEFORE INSERT/UPDATE trigger: set letter_count & hasanat_earned
CREATE OR REPLACE FUNCTION public.tg_set_session_hasanat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_letters INT;
BEGIN
  -- Pastikan kolom yang dipakai sesuai: ayat_start/ayat_end
  v_letters := public.sum_letters(NEW.surah_number, NEW.ayat_start, NEW.ayat_end);
  NEW.letter_count := v_letters;
  NEW.hasanat_earned := v_letters * 10; -- 1 huruf = 10 hasanat

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_session_hasanat_biu ON public.reading_sessions;
CREATE TRIGGER set_session_hasanat_biu
BEFORE INSERT OR UPDATE ON public.reading_sessions
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_session_hasanat();

-- 8) Upsert ke daily_hasanat setelah INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION public.recompute_daily_hasanat_row(p_user UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_letters INT;
  v_total_hasanat INT;
  v_count INT;
BEGIN
  SELECT
    COALESCE(SUM(letter_count), 0),
    COALESCE(SUM(hasanat_earned), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_letters, v_total_hasanat, v_count
  FROM public.reading_sessions rs
  WHERE rs.user_id = p_user
    AND public.session_local_date(rs.user_id, rs.session_time) = p_date;

  IF v_count = 0 THEN
    -- tidak ada sesi pada tanggal itu => hapus baris agregasi jika ada
    DELETE FROM public.daily_hasanat
    WHERE user_id = p_user AND date = p_date;
  ELSE
    INSERT INTO public.daily_hasanat (user_id, date, total_letters, total_hasanat, session_count, updated_at)
    VALUES (p_user, p_date, v_total_letters, v_total_hasanat, v_count, NOW())
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      total_letters = EXCLUDED.total_letters,
      total_hasanat = EXCLUDED.total_hasanat,
      session_count = EXCLUDED.session_count,
      updated_at = NOW();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_update_daily_hasanat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_date DATE;
  new_date DATE;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    new_date := public.session_local_date(NEW.user_id, NEW.session_time);
    PERFORM public.recompute_daily_hasanat_row(NEW.user_id, new_date);
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    old_date := public.session_local_date(OLD.user_id, OLD.session_time);
    new_date := public.session_local_date(NEW.user_id, NEW.session_time);
    -- Recompute keduanya jika beda
    PERFORM public.recompute_daily_hasanat_row(OLD.user_id, old_date);
    PERFORM public.recompute_daily_hasanat_row(NEW.user_id, new_date);
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    old_date := public.session_local_date(OLD.user_id, OLD.session_time);
    PERFORM public.recompute_daily_hasanat_row(OLD.user_id, old_date);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_daily_hasanat_aiud ON public.reading_sessions;
CREATE TRIGGER update_daily_hasanat_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.reading_sessions
FOR EACH ROW
EXECUTE FUNCTION public.tg_update_daily_hasanat();

-- 9) Backfill helper untuk rebuild semua daily_hasanat (opsional)
CREATE OR REPLACE FUNCTION public.rebuild_daily_hasanat_for_user(p_user UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
BEGIN
  DELETE FROM public.daily_hasanat WHERE user_id = p_user;

  FOR r IN
    SELECT DISTINCT public.session_local_date(user_id, session_time) AS d
    FROM public.reading_sessions
    WHERE user_id = p_user
  LOOP
    PERFORM public.recompute_daily_hasanat_row(p_user, r.d);
  END LOOP;
END;
$$;
