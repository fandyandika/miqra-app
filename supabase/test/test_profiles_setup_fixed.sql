-- =========================================
-- MIQRA TEST PROFILES SETUP (FIXED VERSION)
-- =========================================
-- Script untuk membuat 2 profile lengkap untuk testing
-- Profile 1: Ahmad (Owner keluarga, pengguna aktif)
-- Profile 2: Sarah (Member keluarga, pengguna konsisten)

-- =========================================
-- 1. CHECK TABLE STRUCTURE FIRST
-- =========================================

-- Check if profiles table has 'id' or 'user_id' column
DO $$
DECLARE
    has_id_column boolean;
    has_user_id_column boolean;
BEGIN
    -- Check for 'id' column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'id'
    ) INTO has_id_column;
    
    -- Check for 'user_id' column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) INTO has_user_id_column;
    
    RAISE NOTICE 'Profiles table has id column: %', has_id_column;
    RAISE NOTICE 'Profiles table has user_id column: %', has_user_id_column;
END $$;

-- =========================================
-- 2. PROFILES DATA (COMPATIBLE VERSION)
-- =========================================

-- Profile Ahmad (Owner, pengguna aktif)
-- Using dynamic approach to handle both schema versions
DO $$
BEGIN
    -- Check if profiles table has 'id' column (new schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'id'
    ) THEN
        -- New schema with 'id' column
        INSERT INTO public.profiles (
            id,
            display_name,
            avatar_url,
            timezone,
            language,
            created_at,
            updated_at
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            'Ahmad Rahman',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
            'Asia/Jakarta',
            'id',
            '2024-01-01 08:00:00+07',
            '2024-01-01 08:00:00+07'
        ) ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            timezone = EXCLUDED.timezone,
            language = EXCLUDED.language,
            updated_at = EXCLUDED.updated_at;
    ELSE
        -- Old schema with 'user_id' column
        INSERT INTO public.profiles (
            user_id,
            display_name,
            timezone,
            created_at
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            'Ahmad Rahman',
            'Asia/Jakarta',
            '2024-01-01 08:00:00+07'
        ) ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            timezone = EXCLUDED.timezone;
    END IF;
END $$;

-- Profile Sarah (Member, pengguna konsisten)
DO $$
BEGIN
    -- Check if profiles table has 'id' column (new schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'id'
    ) THEN
        -- New schema with 'id' column
        INSERT INTO public.profiles (
            id,
            display_name,
            avatar_url,
            timezone,
            language,
            created_at,
            updated_at
        ) VALUES (
            '22222222-2222-2222-2222-222222222222',
            'Sarah Putri',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            'Asia/Jakarta',
            'id',
            '2024-01-15 10:30:00+07',
            '2024-01-15 10:30:00+07'
        ) ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            timezone = EXCLUDED.timezone,
            language = EXCLUDED.language,
            updated_at = EXCLUDED.updated_at;
    ELSE
        -- Old schema with 'user_id' column
        INSERT INTO public.profiles (
            user_id,
            display_name,
            timezone,
            created_at
        ) VALUES (
            '22222222-2222-2222-2222-222222222222',
            'Sarah Putri',
            'Asia/Jakarta',
            '2024-01-15 10:30:00+07'
        ) ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            timezone = EXCLUDED.timezone;
    END IF;
END $$;

-- =========================================
-- 3. USER SETTINGS
-- =========================================

-- Settings Ahmad (Owner, lebih terbuka)
INSERT INTO public.user_settings (
  user_id,
  hasanat_visible,
  share_with_family,
  join_leaderboard,
  daily_reminder_enabled,
  reminder_time,
  streak_warning_enabled,
  family_nudge_enabled,
  milestone_celebration_enabled,
  daily_goal_ayat,
  theme,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  true,  -- hasanat_visible
  true,  -- share_with_family
  true,  -- join_leaderboard
  true,  -- daily_reminder_enabled
  '06:00:00',  -- reminder_time
  true,  -- streak_warning_enabled
  true,  -- family_nudge_enabled
  true,  -- milestone_celebration_enabled
  10,    -- daily_goal_ayat
  'light',  -- theme
  '2024-01-01 08:00:00+07',
  '2024-01-01 08:00:00+07'
) ON CONFLICT (user_id) DO UPDATE SET
  hasanat_visible = EXCLUDED.hasanat_visible,
  share_with_family = EXCLUDED.share_with_family,
  join_leaderboard = EXCLUDED.join_leaderboard,
  daily_reminder_enabled = EXCLUDED.daily_reminder_enabled,
  reminder_time = EXCLUDED.reminder_time,
  streak_warning_enabled = EXCLUDED.streak_warning_enabled,
  family_nudge_enabled = EXCLUDED.family_nudge_enabled,
  milestone_celebration_enabled = EXCLUDED.milestone_celebration_enabled,
  daily_goal_ayat = EXCLUDED.daily_goal_ayat,
  theme = EXCLUDED.theme,
  updated_at = EXCLUDED.updated_at;

-- Settings Sarah (Member, lebih privat)
INSERT INTO public.user_settings (
  user_id,
  hasanat_visible,
  share_with_family,
  join_leaderboard,
  daily_reminder_enabled,
  reminder_time,
  streak_warning_enabled,
  family_nudge_enabled,
  milestone_celebration_enabled,
  daily_goal_ayat,
  theme,
  created_at,
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  false,  -- hasanat_visible
  true,   -- share_with_family
  false,  -- join_leaderboard
  true,   -- daily_reminder_enabled
  '05:30:00',  -- reminder_time
  true,   -- streak_warning_enabled
  true,   -- family_nudge_enabled
  true,   -- milestone_celebration_enabled
  5,      -- daily_goal_ayat
  'dark', -- theme
  '2024-01-15 10:30:00+07',
  '2024-01-15 10:30:00+07'
) ON CONFLICT (user_id) DO UPDATE SET
  hasanat_visible = EXCLUDED.hasanat_visible,
  share_with_family = EXCLUDED.share_with_family,
  join_leaderboard = EXCLUDED.join_leaderboard,
  daily_reminder_enabled = EXCLUDED.daily_reminder_enabled,
  reminder_time = EXCLUDED.reminder_time,
  streak_warning_enabled = EXCLUDED.streak_warning_enabled,
  family_nudge_enabled = EXCLUDED.family_nudge_enabled,
  milestone_celebration_enabled = EXCLUDED.milestone_celebration_enabled,
  daily_goal_ayat = EXCLUDED.daily_goal_ayat,
  theme = EXCLUDED.theme,
  updated_at = EXCLUDED.updated_at;

-- =========================================
-- 4. FAMILY DATA
-- =========================================

-- Create family (Ahmad sebagai owner)
INSERT INTO families (
  id,
  name,
  created_by,
  created_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Keluarga Rahman',
  '11111111-1111-1111-1111-111111111111',
  '2024-01-01 08:30:00+07'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  created_by = EXCLUDED.created_by;

-- Add Ahmad as family owner
INSERT INTO family_members (
  id,
  family_id,
  user_id,
  role,
  created_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'owner',
  '2024-01-01 08:30:00+07'
) ON CONFLICT (family_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Add Sarah as family member (joined later)
INSERT INTO family_members (
  id,
  family_id,
  user_id,
  role,
  created_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'member',
  '2024-01-20 14:15:00+07'
) ON CONFLICT (family_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- =========================================
-- 5. READING PROGRESS
-- =========================================

-- Ahmad's reading progress (sudah khatam 1x, sedang khatam ke-2)
INSERT INTO reading_progress (
  user_id,
  current_surah,
  current_ayat,
  total_ayat_read,
  khatam_count,
  last_read_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  15,  -- current_surah (Al-Hijr)
  25,  -- current_ayat
  6236 + 350,  -- total_ayat_read (1 khatam + 350 ayat)
  1,   -- khatam_count
  '2024-01-25 18:30:00+07',
  '2024-01-25 18:30:00+07'
) ON CONFLICT (user_id) DO UPDATE SET
  current_surah = EXCLUDED.current_surah,
  current_ayat = EXCLUDED.current_ayat,
  total_ayat_read = EXCLUDED.total_ayat_read,
  khatam_count = EXCLUDED.khatam_count,
  last_read_at = EXCLUDED.last_read_at,
  updated_at = EXCLUDED.updated_at;

-- Sarah's reading progress (belum khatam, konsisten)
INSERT INTO reading_progress (
  user_id,
  current_surah,
  current_ayat,
  total_ayat_read,
  khatam_count,
  last_read_at,
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  8,   -- current_surah (Al-Anfal)
  12,  -- current_ayat
  1850,  -- total_ayat_read
  0,   -- khatam_count
  '2024-01-25 05:45:00+07',
  '2024-01-25 05:45:00+07'
) ON CONFLICT (user_id) DO UPDATE SET
  current_surah = EXCLUDED.current_surah,
  current_ayat = EXCLUDED.current_ayat,
  total_ayat_read = EXCLUDED.total_ayat_read,
  khatam_count = EXCLUDED.khatam_count,
  last_read_at = EXCLUDED.last_read_at,
  updated_at = EXCLUDED.updated_at;

-- =========================================
-- 6. STREAKS DATA
-- =========================================

-- Ahmad's streak (streak panjang tapi kadang putus)
INSERT INTO streaks (
  user_id,
  current,
  longest,
  last_date
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  12,  -- current streak
  45,  -- longest streak
  '2024-01-25'  -- last_date
) ON CONFLICT (user_id) DO UPDATE SET
  current = EXCLUDED.current,
  longest = EXCLUDED.longest,
  last_date = EXCLUDED.last_date;

-- Sarah's streak (konsisten setiap hari)
INSERT INTO streaks (
  user_id,
  current,
  longest,
  last_date
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  25,  -- current streak
  25,  -- longest streak
  '2024-01-25'  -- last_date
) ON CONFLICT (user_id) DO UPDATE SET
  current = EXCLUDED.current,
  longest = EXCLUDED.longest,
  last_date = EXCLUDED.last_date;

-- =========================================
-- 7. CHECKINS DATA (30 hari terakhir)
-- =========================================

-- Ahmad's checkins (konsisten dengan variasi ayat)
INSERT INTO checkins (user_id, date, ayat_count, created_at) VALUES
-- Jan 2024
('11111111-1111-1111-1111-111111111111', '2024-01-01', 15, '2024-01-01 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-02', 12, '2024-01-02 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-03', 20, '2024-01-03 17:45:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-04', 8, '2024-01-04 20:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-05', 25, '2024-01-05 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-06', 18, '2024-01-06 19:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-07', 22, '2024-01-07 17:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-08', 14, '2024-01-08 18:45:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-09', 16, '2024-01-09 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-10', 30, '2024-01-10 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-11', 10, '2024-01-11 20:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-12', 28, '2024-01-12 17:45:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-13', 0, '2024-01-13 00:00:00+07'),  -- Missed day
('11111111-1111-1111-1111-111111111111', '2024-01-14', 35, '2024-01-14 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-15', 12, '2024-01-15 19:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-16', 24, '2024-01-16 18:15:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-17', 18, '2024-01-17 19:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-18', 26, '2024-01-18 17:45:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-19', 14, '2024-01-19 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-20', 32, '2024-01-20 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-21', 16, '2024-01-21 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-22', 22, '2024-01-22 18:45:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-23', 20, '2024-01-23 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-24', 18, '2024-01-24 19:30:00+07'),
('11111111-1111-1111-1111-111111111111', '2024-01-25', 15, '2024-01-25 18:30:00+07')
ON CONFLICT (user_id, date) DO UPDATE SET
  ayat_count = EXCLUDED.ayat_count,
  created_at = EXCLUDED.created_at;

-- Sarah's checkins (konsisten setiap hari, 5-8 ayat)
INSERT INTO checkins (user_id, date, ayat_count, created_at) VALUES
-- Jan 2024 (mulai dari 15 Jan)
('22222222-2222-2222-2222-222222222222', '2024-01-15', 5, '2024-01-15 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-16', 6, '2024-01-16 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-17', 7, '2024-01-17 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-18', 5, '2024-01-18 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-19', 8, '2024-01-19 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-20', 6, '2024-01-20 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-21', 7, '2024-01-21 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-22', 5, '2024-01-22 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-23', 6, '2024-01-23 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-24', 8, '2024-01-24 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', '2024-01-25', 7, '2024-01-25 05:45:00+07')
ON CONFLICT (user_id, date) DO UPDATE SET
  ayat_count = EXCLUDED.ayat_count,
  created_at = EXCLUDED.created_at;

-- =========================================
-- 8. READING SESSIONS (Detail bacaan)
-- =========================================

-- Ahmad's reading sessions (variasi surah dan ayat)
INSERT INTO reading_sessions (user_id, surah_number, ayat_start, ayat_end, date, session_time, notes, created_at) VALUES
-- Recent sessions (Jan 2024)
('11111111-1111-1111-1111-111111111111', 1, 1, 7, '2024-01-01', '2024-01-01 18:30:00+07', 'Al-Fatihah - memulai khatam ke-2', '2024-01-01 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 1, 5, '2024-01-01', '2024-01-01 18:35:00+07', 'Al-Baqarah awal', '2024-01-01 18:35:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 6, 15, '2024-01-02', '2024-01-02 19:15:00+07', 'Al-Baqarah lanjutan', '2024-01-02 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 16, 30, '2024-01-03', '2024-01-03 17:45:00+07', 'Al-Baqarah ayat panjang', '2024-01-03 17:45:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 31, 40, '2024-01-04', '2024-01-04 20:00:00+07', 'Al-Baqarah malam', '2024-01-04 20:00:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 41, 60, '2024-01-05', '2024-01-05 18:30:00+07', 'Al-Baqarah pagi', '2024-01-05 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 61, 75, '2024-01-06', '2024-01-06 19:00:00+07', 'Al-Baqarah sore', '2024-01-06 19:00:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 76, 90, '2024-01-07', '2024-01-07 17:30:00+07', 'Al-Baqarah malam', '2024-01-07 17:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 91, 105, '2024-01-08', '2024-01-08 18:45:00+07', 'Al-Baqarah lanjutan', '2024-01-08 18:45:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 106, 120, '2024-01-09', '2024-01-09 19:15:00+07', 'Al-Baqarah pagi', '2024-01-09 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 121, 150, '2024-01-10', '2024-01-10 18:00:00+07', 'Al-Baqarah sore', '2024-01-10 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 151, 160, '2024-01-11', '2024-01-11 20:30:00+07', 'Al-Baqarah malam', '2024-01-11 20:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 161, 185, '2024-01-12', '2024-01-12 17:45:00+07', 'Al-Baqarah sore', '2024-01-12 17:45:00+07'),
-- Missed day 13 Jan
('11111111-1111-1111-1111-111111111111', 2, 186, 210, '2024-01-14', '2024-01-14 18:30:00+07', 'Al-Baqarah pagi', '2024-01-14 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 211, 220, '2024-01-15', '2024-01-15 19:00:00+07', 'Al-Baqarah sore', '2024-01-15 19:00:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 221, 240, '2024-01-16', '2024-01-16 18:15:00+07', 'Al-Baqarah malam', '2024-01-16 18:15:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 241, 255, '2024-01-17', '2024-01-17 19:30:00+07', 'Al-Baqarah sore', '2024-01-17 19:30:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 256, 275, '2024-01-18', '2024-01-18 17:45:00+07', 'Al-Baqarah pagi', '2024-01-18 17:45:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 276, 285, '2024-01-19', '2024-01-19 18:00:00+07', 'Al-Baqarah sore', '2024-01-19 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', 2, 286, 286, '2024-01-20', '2024-01-20 18:30:00+07', 'Ayat Kursi - selesai Al-Baqarah', '2024-01-20 18:30:00+07'),
('11111111-1111-1111-1111-111111111111', 3, 1, 15, '2024-01-21', '2024-01-21 19:15:00+07', 'Ali Imran awal', '2024-01-21 19:15:00+07'),
('11111111-1111-1111-1111-111111111111', 3, 16, 30, '2024-01-22', '2024-01-22 18:45:00+07', 'Ali Imran lanjutan', '2024-01-22 18:45:00+07'),
('11111111-1111-1111-1111-111111111111', 3, 31, 45, '2024-01-23', '2024-01-23 18:00:00+07', 'Ali Imran sore', '2024-01-23 18:00:00+07'),
('11111111-1111-1111-1111-111111111111', 3, 46, 60, '2024-01-24', '2024-01-24 19:30:00+07', 'Ali Imran malam', '2024-01-24 19:30:00+07'),
('11111111-1111-1111-1111-111111111111', 3, 61, 75, '2024-01-25', '2024-01-25 18:30:00+07', 'Ali Imran pagi', '2024-01-25 18:30:00+07');

-- Sarah's reading sessions (konsisten, surah pendek)
INSERT INTO reading_sessions (user_id, surah_number, ayat_start, ayat_end, date, session_time, notes, created_at) VALUES
-- Recent sessions (Jan 2024)
('22222222-2222-2222-2222-222222222222', 1, 1, 7, '2024-01-15', '2024-01-15 05:45:00+07', 'Al-Fatihah pagi', '2024-01-15 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 1, 5, '2024-01-16', '2024-01-16 05:30:00+07', 'Al-Baqarah awal', '2024-01-16 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 6, 10, '2024-01-17', '2024-01-17 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-17 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 11, 15, '2024-01-18', '2024-01-18 05:30:00+07', 'Al-Baqarah pagi', '2024-01-18 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 16, 20, '2024-01-19', '2024-01-19 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-19 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 21, 25, '2024-01-20', '2024-01-20 05:30:00+07', 'Al-Baqarah pagi', '2024-01-20 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 26, 30, '2024-01-21', '2024-01-21 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-21 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 31, 35, '2024-01-22', '2024-01-22 05:30:00+07', 'Al-Baqarah pagi', '2024-01-22 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 36, 40, '2024-01-23', '2024-01-23 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-23 05:45:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 41, 45, '2024-01-24', '2024-01-24 05:30:00+07', 'Al-Baqarah pagi', '2024-01-24 05:30:00+07'),
('22222222-2222-2222-2222-222222222222', 2, 46, 50, '2024-01-25', '2024-01-25 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-25 05:45:00+07');

-- =========================================
-- 9. DEVICE TOKENS (untuk notifikasi)
-- =========================================

-- Ahmad's device token
INSERT INTO device_tokens (user_id, token, platform, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'ahmad_device_token_12345', 'android', '2024-01-01 08:00:00+07')
ON CONFLICT (user_id, token) DO UPDATE SET
  platform = EXCLUDED.platform,
  created_at = EXCLUDED.created_at;

-- Sarah's device token
INSERT INTO device_tokens (user_id, token, platform, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'sarah_device_token_67890', 'ios', '2024-01-15 10:30:00+07')
ON CONFLICT (user_id, token) DO UPDATE SET
  platform = EXCLUDED.platform,
  created_at = EXCLUDED.created_at;

-- =========================================
-- 10. INVITE CODES (untuk testing family invite)
-- =========================================

-- Create active invite code for family
INSERT INTO invite_codes (code, family_id, ttl, used) VALUES
('123456', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-01-26 23:59:59+07', false)
ON CONFLICT (code) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  ttl = EXCLUDED.ttl,
  used = EXCLUDED.used;

-- Create expired invite code (for testing)
INSERT INTO invite_codes (code, family_id, ttl, used) VALUES
('999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-01-20 23:59:59+07', false)
ON CONFLICT (code) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  ttl = EXCLUDED.ttl,
  used = EXCLUDED.used;

-- Create used invite code (for testing)
INSERT INTO invite_codes (code, family_id, ttl, used) VALUES
('888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-01-25 23:59:59+07', true)
ON CONFLICT (code) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  ttl = EXCLUDED.ttl,
  used = EXCLUDED.used;

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Verify data has been inserted correctly
SELECT 'Profiles' as table_name, count(*) as count FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'User Settings', count(*) FROM user_settings WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Families', count(*) FROM families WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
UNION ALL
SELECT 'Family Members', count(*) FROM family_members WHERE family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
UNION ALL
SELECT 'Reading Progress', count(*) FROM reading_progress WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Streaks', count(*) FROM streaks WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Checkins', count(*) FROM checkins WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Reading Sessions', count(*) FROM reading_sessions WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Device Tokens', count(*) FROM device_tokens WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'Invite Codes', count(*) FROM invite_codes WHERE family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
