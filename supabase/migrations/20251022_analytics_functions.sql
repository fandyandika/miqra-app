-- =========================================
-- ANALYTICS FUNCTIONS FOR MIQRA
-- =========================================
-- High-performance analytics aggregation functions
-- All heavy lifting in PostgreSQL, minimal client processing

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Extract date from timestamp (timezone-safe)
CREATE OR REPLACE FUNCTION public._rs_day(ts timestamptz)
RETURNS date 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
AS $$
  SELECT (ts AT TIME ZONE 'UTC')::date
$$;

-- Get session date (prefer session_time, fallback to created_at)
CREATE OR REPLACE FUNCTION public._rs_date(session_time timestamptz, created_at timestamptz)
RETURNS date 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
AS $$
  SELECT public._rs_day(COALESCE(session_time, created_at))
$$;

-- =========================================
-- DAILY STATS (with gap filling)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_daily_stats(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  date text,
  ayat_count int,
  session_count int
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(d, 'YYYY-MM-DD') AS date,
    COALESCE(SUM(rs.ayat_count), 0)::int AS ayat_count,
    COALESCE(COUNT(rs.id), 0)::int AS session_count
  FROM generate_series(p_start_date, p_end_date, interval '1 day') AS d
  LEFT JOIN reading_sessions rs
    ON rs.user_id = p_user_id
   AND public._rs_date(rs.session_time, rs.created_at) = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;

-- =========================================
-- WEEKLY STATS (aggregated by week)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_weekly_stats(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  week_start text,
  total_ayat int,
  avg_ayat_per_day numeric,
  days_active int
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  RETURN QUERY
  WITH daily_data AS (
    SELECT
      public._rs_date(rs.session_time, rs.created_at) AS read_date,
      SUM(rs.ayat_count) AS ayat
    FROM reading_sessions rs
    WHERE rs.user_id = p_user_id
      AND public._rs_date(rs.session_time, rs.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY read_date
  )
  SELECT
    TO_CHAR(DATE_TRUNC('week', read_date)::date, 'YYYY-MM-DD') AS week_start,
    SUM(ayat)::int AS total_ayat,
    ROUND(AVG(ayat), 1) AS avg_ayat_per_day,
    COUNT(*)::int AS days_active
  FROM daily_data
  GROUP BY DATE_TRUNC('week', read_date)
  ORDER BY DATE_TRUNC('week', read_date);
END;
$$;

-- =========================================
-- MONTHLY STATS (last N months including current)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_monthly_stats(
  p_user_id uuid,
  p_months int
)
RETURNS TABLE (
  month text,
  total_ayat int,
  avg_ayat_per_day numeric,
  days_active int,
  total_days int
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  RETURN QUERY
  WITH month_range AS (
    SELECT 
      DATE_TRUNC('month', CURRENT_DATE)::date - make_interval(months => m) AS month_start
    FROM generate_series(0, GREATEST(p_months - 1, 0)) AS m
  ),
  daily_data AS (
    SELECT
      public._rs_date(rs.session_time, rs.created_at) AS read_date,
      SUM(rs.ayat_count) AS ayat
    FROM reading_sessions rs
    WHERE rs.user_id = p_user_id
    GROUP BY read_date
  )
  SELECT
    TO_CHAR(mr.month_start, 'YYYY-MM') AS month,
    COALESCE(
      (SELECT SUM(ayat)::int 
       FROM daily_data 
       WHERE read_date >= mr.month_start 
         AND read_date < (mr.month_start + interval '1 month')::date
      ), 0
    ) AS total_ayat,
    COALESCE(
      (SELECT ROUND(AVG(ayat), 1)
       FROM daily_data 
       WHERE read_date >= mr.month_start 
         AND read_date < (mr.month_start + interval '1 month')::date
      ), 0
    ) AS avg_ayat_per_day,
    COALESCE(
      (SELECT COUNT(*)::int
       FROM daily_data 
       WHERE read_date >= mr.month_start 
         AND read_date < (mr.month_start + interval '1 month')::date
      ), 0
    ) AS days_active,
    EXTRACT(DAY FROM (mr.month_start + interval '1 month' - interval '1 day'))::int AS total_days
  FROM month_range mr
  ORDER BY month DESC;
END;
$$;

-- =========================================
-- USER TOTAL STATS (with streak calculation)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_user_total_stats(p_user_id uuid)
RETURNS TABLE (
  total_ayat int,
  current_streak int,
  longest_streak int,
  total_sessions int
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  RETURN QUERY
  WITH reading_days AS (
    SELECT DISTINCT 
      public._rs_date(rs.session_time, rs.created_at) AS read_date
    FROM reading_sessions rs
    WHERE rs.user_id = p_user_id
  ),
  ordered_days AS (
    SELECT 
      read_date,
      ROW_NUMBER() OVER (ORDER BY read_date) AS row_num
    FROM reading_days
  ),
  streak_groups AS (
    SELECT
      read_date,
      row_num,
      (read_date - (row_num || ' days')::interval)::date AS streak_group
    FROM ordered_days
  ),
  streak_lengths AS (
    SELECT
      streak_group,
      MIN(read_date) AS streak_start,
      MAX(read_date) AS streak_end,
      COUNT(*)::int AS streak_length
    FROM streak_groups
    GROUP BY streak_group
  )
  SELECT
    COALESCE((SELECT SUM(ayat_count) FROM reading_sessions WHERE user_id = p_user_id), 0)::int AS total_ayat,
    COALESCE(
      (SELECT streak_length 
       FROM streak_lengths 
       WHERE streak_end = CURRENT_DATE 
       LIMIT 1
      ), 0
    )::int AS current_streak,
    COALESCE((SELECT MAX(streak_length) FROM streak_lengths), 0)::int AS longest_streak,
    COALESCE((SELECT COUNT(*) FROM reading_sessions WHERE user_id = p_user_id), 0)::int AS total_sessions;
END;
$$;

-- =========================================
-- FAMILY AGGREGATE STATS
-- =========================================

CREATE OR REPLACE FUNCTION public.get_family_stats(p_family_id uuid)
RETURNS TABLE (
  total_family_ayat int,
  avg_ayat_per_member numeric,
  member_count int
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  RETURN QUERY
  WITH family_members_list AS (
    SELECT DISTINCT user_id 
    FROM family_members 
    WHERE family_id = p_family_id
  ),
  member_totals AS (
    SELECT 
      fm.user_id,
      COALESCE(SUM(rs.ayat_count), 0) AS total_ayat
    FROM family_members_list fm
    LEFT JOIN reading_sessions rs ON rs.user_id = fm.user_id
    GROUP BY fm.user_id
  )
  SELECT
    COALESCE(SUM(total_ayat), 0)::int AS total_family_ayat,
    ROUND(AVG(total_ayat), 1) AS avg_ayat_per_member,
    (SELECT COUNT(*) FROM family_members_list)::int AS member_count
  FROM member_totals;
END;
$$;

-- =========================================
-- INDEXES (for performance)
-- =========================================

-- Composite index for efficient date-range queries
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date
  ON public.reading_sessions (user_id, session_time, created_at);

-- Index for family queries
CREATE INDEX IF NOT EXISTS idx_family_members_family_user
  ON public.family_members (family_id, user_id);
