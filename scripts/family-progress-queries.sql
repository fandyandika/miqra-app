-- ========================================
-- QUERIES UNTUK MELIHAT PROGRESS KELUARGA
-- ========================================

-- 1. LIHAT SEMUA KELUARGA DAN ANGGOTANYA
SELECT 
  f.id as family_id,
  f.name as family_name,
  f.created_at as family_created,
  COUNT(fm.user_id) as total_members
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
GROUP BY f.id, f.name, f.created_at
ORDER BY f.created_at DESC;

-- 2. LIHAT ANGGOTA KELUARGA DENGAN NAMA
SELECT 
  f.name as family_name,
  fm.role,
  p.display_name,
  fm.created_at as joined_at
FROM families f
JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN profiles p ON fm.user_id = p.user_id
ORDER BY f.name, fm.role DESC, fm.created_at;

-- 3. LIHAT CHECKIN HARI INI PER KELUARGA
SELECT 
  f.name as family_name,
  p.display_name,
  c.date,
  c.ayat_count,
  c.created_at
FROM families f
JOIN family_members fm ON f.id = fm.family_id
JOIN checkins c ON fm.user_id = c.user_id
LEFT JOIN profiles p ON fm.user_id = p.user_id
WHERE c.date = CURRENT_DATE
ORDER BY f.name, c.created_at DESC;

-- 4. HITUNG PROGRESS KELUARGA HARI INI
SELECT 
  f.name as family_name,
  COUNT(DISTINCT fm.user_id) as total_members,
  COUNT(DISTINCT CASE WHEN c.date = CURRENT_DATE THEN c.user_id END) as members_read_today,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.date = CURRENT_DATE THEN c.user_id END) * 100.0 / 
    COUNT(DISTINCT fm.user_id), 2
  ) as progress_percentage
FROM families f
JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN checkins c ON fm.user_id = c.user_id AND c.date = CURRENT_DATE
GROUP BY f.id, f.name
ORDER BY progress_percentage DESC;

-- 5. LIHAT STREAK KELUARGA (7 HARI TERAKHIR)
WITH family_checkins AS (
  SELECT 
    f.id as family_id,
    f.name as family_name,
    c.date,
    COUNT(DISTINCT c.user_id) as members_checked_in
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  JOIN checkins c ON fm.user_id = c.user_id
  WHERE c.date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY f.id, f.name, c.date
),
daily_progress AS (
  SELECT 
    family_id,
    family_name,
    date,
    members_checked_in,
    LAG(date) OVER (PARTITION BY family_id ORDER BY date) as prev_date
  FROM family_checkins
)
SELECT 
  family_name,
  date,
  members_checked_in,
  CASE 
    WHEN prev_date IS NULL OR date = prev_date + INTERVAL '1 day' THEN '✅'
    ELSE '❌'
  END as streak_continues
FROM daily_progress
ORDER BY family_name, date DESC;

-- 6. LIHAT CHECKIN TERBARU PER USER
SELECT 
  p.display_name,
  f.name as family_name,
  c.date,
  c.ayat_count,
  c.created_at
FROM checkins c
JOIN profiles p ON c.user_id = p.user_id
LEFT JOIN family_members fm ON c.user_id = fm.user_id
LEFT JOIN families f ON fm.family_id = f.id
ORDER BY c.created_at DESC
LIMIT 20;

-- 7. STATISTIK KELUARGA LENGKAP
SELECT 
  f.name as family_name,
  COUNT(DISTINCT fm.user_id) as total_members,
  COUNT(DISTINCT c.user_id) as members_with_checkins,
  COUNT(c.id) as total_checkins,
  MIN(c.date) as first_checkin,
  MAX(c.date) as last_checkin,
  AVG(c.ayat_count) as avg_ayat_per_checkin
FROM families f
JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN checkins c ON fm.user_id = c.user_id
GROUP BY f.id, f.name
ORDER BY total_checkins DESC;
