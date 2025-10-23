-- Test script untuk debug family stats
-- Jalankan di Supabase SQL Editor

-- 1. Cek apakah ada data di family_members
SELECT 
  fm.family_id,
  f.name as family_name,
  COUNT(fm.user_id) as member_count
FROM family_members fm
LEFT JOIN families f ON f.id = fm.family_id
GROUP BY fm.family_id, f.name;

-- 2. Cek apakah ada data di reading_sessions
SELECT 
  user_id,
  COUNT(*) as session_count,
  SUM(ayat_count) as total_ayat
FROM reading_sessions
GROUP BY user_id
ORDER BY total_ayat DESC;

-- 3. Test RPC function get_family_stats
-- Ganti dengan family_id yang ada di database Anda
SELECT * FROM get_family_stats('YOUR_FAMILY_ID_HERE');

-- 4. Test manual query untuk family stats
WITH family_members_list AS (
  SELECT user_id
  FROM family_members 
  WHERE family_id = 'YOUR_FAMILY_ID_HERE'
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
