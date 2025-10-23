-- =========================================
-- MIQRA TEST PROFILES SETUP (WITH AUTH USERS)
-- =========================================
-- Script untuk membuat 2 profile lengkap untuk testing
-- Profile 1: Ahmad (Owner keluarga, pengguna aktif)
-- Profile 2: Sarah (Member keluarga, pengguna konsisten)

-- =========================================
-- 1. CREATE AUTH USERS FIRST
-- =========================================

-- Insert auth users (ini biasanya dilakukan via Supabase Auth UI)
-- Untuk testing, kita akan menggunakan user ID yang sudah ada atau membuat yang baru

-- Check if we have any existing users
DO $$
DECLARE
    existing_user_count integer;
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO existing_user_count FROM auth.users;
    RAISE NOTICE 'Existing users count: %', existing_user_count;
    
    -- Try to get existing user IDs
    SELECT id INTO ahmad_user_id FROM auth.users LIMIT 1;
    IF ahmad_user_id IS NOT NULL THEN
        RAISE NOTICE 'Using existing user ID for Ahmad: %', ahmad_user_id;
    END IF;
    
    -- Get second user ID if available
    SELECT id INTO sarah_user_id FROM auth.users OFFSET 1 LIMIT 1;
    IF sarah_user_id IS NOT NULL THEN
        RAISE NOTICE 'Using existing user ID for Sarah: %', sarah_user_id;
    END IF;
    
    -- If we don't have enough users, we'll need to create them via Supabase Auth UI
    IF existing_user_count < 2 THEN
        RAISE NOTICE 'Not enough users in auth.users. Please create 2 users via Supabase Auth UI first.';
        RAISE NOTICE 'Or use the following user IDs if you have them:';
        RAISE NOTICE 'Ahmad: 11111111-1111-1111-1111-111111111111';
        RAISE NOTICE 'Sarah: 22222222-2222-2222-2222-222222222222';
    END IF;
END $$;

-- =========================================
-- 2. USE EXISTING USERS OR CREATE TEST DATA
-- =========================================

-- Get the first two user IDs from auth.users
WITH user_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM auth.users
    ORDER BY created_at
    LIMIT 2
)
SELECT 
    (SELECT id FROM user_ids WHERE rn = 1) as ahmad_id,
    (SELECT id FROM user_ids WHERE rn = 2) as sarah_id;

-- =========================================
-- 3. PROFILES DATA (USING EXISTING USERS)
-- =========================================

-- Profile Ahmad (Owner, pengguna aktif) - using first available user
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get first two user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    IF ahmad_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users. Please create users via Supabase Auth UI first.';
    END IF;
    
    RAISE NOTICE 'Using Ahmad user ID: %', ahmad_user_id;
    IF sarah_user_id IS NOT NULL THEN
        RAISE NOTICE 'Using Sarah user ID: %', sarah_user_id;
    END IF;
    
    -- Check if profiles table has 'id' or 'user_id' column
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
            ahmad_user_id,
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
            
        -- Sarah's profile if second user exists
        IF sarah_user_id IS NOT NULL THEN
            INSERT INTO public.profiles (
                id,
                display_name,
                avatar_url,
                timezone,
                language,
                created_at,
                updated_at
            ) VALUES (
                sarah_user_id,
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
        END IF;
    ELSE
        -- Old schema with 'user_id' column
        INSERT INTO public.profiles (
            user_id,
            display_name,
            timezone,
            created_at
        ) VALUES (
            ahmad_user_id,
            'Ahmad Rahman',
            'Asia/Jakarta',
            '2024-01-01 08:00:00+07'
        ) ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            timezone = EXCLUDED.timezone;
            
        -- Sarah's profile if second user exists
        IF sarah_user_id IS NOT NULL THEN
            INSERT INTO public.profiles (
                user_id,
                display_name,
                timezone,
                created_at
            ) VALUES (
                sarah_user_id,
                'Sarah Putri',
                'Asia/Jakarta',
                '2024-01-15 10:30:00+07'
            ) ON CONFLICT (user_id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                timezone = EXCLUDED.timezone;
        END IF;
    END IF;
END $$;

-- =========================================
-- 4. USER SETTINGS
-- =========================================

-- Settings Ahmad (Owner, lebih terbuka)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's settings
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
        ahmad_user_id,
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
    
    -- Sarah's settings if second user exists
    IF sarah_user_id IS NOT NULL THEN
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
            sarah_user_id,
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
    END IF;
END $$;

-- =========================================
-- 5. FAMILY DATA
-- =========================================

-- Create family (Ahmad sebagai owner)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
    family_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Create family
    INSERT INTO families (
        id,
        name,
        created_by,
        created_at
    ) VALUES (
        family_id,
        'Keluarga Rahman',
        ahmad_user_id,
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
        family_id,
        ahmad_user_id,
        'owner',
        '2024-01-01 08:30:00+07'
    ) ON CONFLICT (family_id, user_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    -- Add Sarah as family member if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO family_members (
            id,
            family_id,
            user_id,
            role,
            created_at
        ) VALUES (
            'cccccccc-cccc-cccc-cccc-cccccccccccc',
            family_id,
            sarah_user_id,
            'member',
            '2024-01-20 14:15:00+07'
        ) ON CONFLICT (family_id, user_id) DO UPDATE SET
            role = EXCLUDED.role;
    END IF;
END $$;

-- =========================================
-- 6. READING PROGRESS
-- =========================================

-- Ahmad's reading progress (sudah khatam 1x, sedang khatam ke-2)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's progress
    INSERT INTO reading_progress (
        user_id,
        current_surah,
        current_ayat,
        total_ayat_read,
        khatam_count,
        last_read_at,
        updated_at
    ) VALUES (
        ahmad_user_id,
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
    
    -- Sarah's progress if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO reading_progress (
            user_id,
            current_surah,
            current_ayat,
            total_ayat_read,
            khatam_count,
            last_read_at,
            updated_at
        ) VALUES (
            sarah_user_id,
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
    END IF;
END $$;

-- =========================================
-- 7. STREAKS DATA
-- =========================================

-- Ahmad's streak (streak panjang tapi kadang putus)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's streak
    INSERT INTO streaks (
        user_id,
        current,
        longest,
        last_date
    ) VALUES (
        ahmad_user_id,
        12,  -- current streak
        45,  -- longest streak
        '2024-01-25'  -- last_date
    ) ON CONFLICT (user_id) DO UPDATE SET
        current = EXCLUDED.current,
        longest = EXCLUDED.longest,
        last_date = EXCLUDED.last_date;
    
    -- Sarah's streak if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO streaks (
            user_id,
            current,
            longest,
            last_date
        ) VALUES (
            sarah_user_id,
            25,  -- current streak
            25,  -- longest streak
            '2024-01-25'  -- last_date
        ) ON CONFLICT (user_id) DO UPDATE SET
            current = EXCLUDED.current,
            longest = EXCLUDED.longest,
            last_date = EXCLUDED.last_date;
    END IF;
END $$;

-- =========================================
-- 8. CHECKINS DATA (30 hari terakhir)
-- =========================================

-- Ahmad's checkins (konsisten dengan variasi ayat)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's checkins
    INSERT INTO checkins (user_id, date, ayat_count, created_at) VALUES
    -- Jan 2024
    (ahmad_user_id, '2024-01-01', 15, '2024-01-01 18:30:00+07'),
    (ahmad_user_id, '2024-01-02', 12, '2024-01-02 19:15:00+07'),
    (ahmad_user_id, '2024-01-03', 20, '2024-01-03 17:45:00+07'),
    (ahmad_user_id, '2024-01-04', 8, '2024-01-04 20:00:00+07'),
    (ahmad_user_id, '2024-01-05', 25, '2024-01-05 18:30:00+07'),
    (ahmad_user_id, '2024-01-06', 18, '2024-01-06 19:00:00+07'),
    (ahmad_user_id, '2024-01-07', 22, '2024-01-07 17:30:00+07'),
    (ahmad_user_id, '2024-01-08', 14, '2024-01-08 18:45:00+07'),
    (ahmad_user_id, '2024-01-09', 16, '2024-01-09 19:15:00+07'),
    (ahmad_user_id, '2024-01-10', 30, '2024-01-10 18:00:00+07'),
    (ahmad_user_id, '2024-01-11', 10, '2024-01-11 20:30:00+07'),
    (ahmad_user_id, '2024-01-12', 28, '2024-01-12 17:45:00+07'),
    (ahmad_user_id, '2024-01-13', 0, '2024-01-13 00:00:00+07'),  -- Missed day
    (ahmad_user_id, '2024-01-14', 35, '2024-01-14 18:30:00+07'),
    (ahmad_user_id, '2024-01-15', 12, '2024-01-15 19:00:00+07'),
    (ahmad_user_id, '2024-01-16', 24, '2024-01-16 18:15:00+07'),
    (ahmad_user_id, '2024-01-17', 18, '2024-01-17 19:30:00+07'),
    (ahmad_user_id, '2024-01-18', 26, '2024-01-18 17:45:00+07'),
    (ahmad_user_id, '2024-01-19', 14, '2024-01-19 18:00:00+07'),
    (ahmad_user_id, '2024-01-20', 32, '2024-01-20 18:30:00+07'),
    (ahmad_user_id, '2024-01-21', 16, '2024-01-21 19:15:00+07'),
    (ahmad_user_id, '2024-01-22', 22, '2024-01-22 18:45:00+07'),
    (ahmad_user_id, '2024-01-23', 20, '2024-01-23 18:00:00+07'),
    (ahmad_user_id, '2024-01-24', 18, '2024-01-24 19:30:00+07'),
    (ahmad_user_id, '2024-01-25', 15, '2024-01-25 18:30:00+07')
    ON CONFLICT (user_id, date) DO UPDATE SET
        ayat_count = EXCLUDED.ayat_count,
        created_at = EXCLUDED.created_at;
    
    -- Sarah's checkins if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO checkins (user_id, date, ayat_count, created_at) VALUES
        -- Jan 2024 (mulai dari 15 Jan)
        (sarah_user_id, '2024-01-15', 5, '2024-01-15 05:45:00+07'),
        (sarah_user_id, '2024-01-16', 6, '2024-01-16 05:30:00+07'),
        (sarah_user_id, '2024-01-17', 7, '2024-01-17 05:45:00+07'),
        (sarah_user_id, '2024-01-18', 5, '2024-01-18 05:30:00+07'),
        (sarah_user_id, '2024-01-19', 8, '2024-01-19 05:45:00+07'),
        (sarah_user_id, '2024-01-20', 6, '2024-01-20 05:30:00+07'),
        (sarah_user_id, '2024-01-21', 7, '2024-01-21 05:45:00+07'),
        (sarah_user_id, '2024-01-22', 5, '2024-01-22 05:30:00+07'),
        (sarah_user_id, '2024-01-23', 6, '2024-01-23 05:45:00+07'),
        (sarah_user_id, '2024-01-24', 8, '2024-01-24 05:30:00+07'),
        (sarah_user_id, '2024-01-25', 7, '2024-01-25 05:45:00+07')
        ON CONFLICT (user_id, date) DO UPDATE SET
            ayat_count = EXCLUDED.ayat_count,
            created_at = EXCLUDED.created_at;
    END IF;
END $$;

-- =========================================
-- 9. READING SESSIONS (Detail bacaan)
-- =========================================

-- Ahmad's reading sessions (variasi surah dan ayat)
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's reading sessions
    INSERT INTO reading_sessions (user_id, surah_number, ayat_start, ayat_end, date, session_time, notes, created_at) VALUES
    -- Recent sessions (Jan 2024)
    (ahmad_user_id, 1, 1, 7, '2024-01-01', '2024-01-01 18:30:00+07', 'Al-Fatihah - memulai khatam ke-2', '2024-01-01 18:30:00+07'),
    (ahmad_user_id, 2, 1, 5, '2024-01-01', '2024-01-01 18:35:00+07', 'Al-Baqarah awal', '2024-01-01 18:35:00+07'),
    (ahmad_user_id, 2, 6, 15, '2024-01-02', '2024-01-02 19:15:00+07', 'Al-Baqarah lanjutan', '2024-01-02 19:15:00+07'),
    (ahmad_user_id, 2, 16, 30, '2024-01-03', '2024-01-03 17:45:00+07', 'Al-Baqarah ayat panjang', '2024-01-03 17:45:00+07'),
    (ahmad_user_id, 2, 31, 40, '2024-01-04', '2024-01-04 20:00:00+07', 'Al-Baqarah malam', '2024-01-04 20:00:00+07'),
    (ahmad_user_id, 2, 41, 60, '2024-01-05', '2024-01-05 18:30:00+07', 'Al-Baqarah pagi', '2024-01-05 18:30:00+07'),
    (ahmad_user_id, 2, 61, 75, '2024-01-06', '2024-01-06 19:00:00+07', 'Al-Baqarah sore', '2024-01-06 19:00:00+07'),
    (ahmad_user_id, 2, 76, 90, '2024-01-07', '2024-01-07 17:30:00+07', 'Al-Baqarah malam', '2024-01-07 17:30:00+07'),
    (ahmad_user_id, 2, 91, 105, '2024-01-08', '2024-01-08 18:45:00+07', 'Al-Baqarah lanjutan', '2024-01-08 18:45:00+07'),
    (ahmad_user_id, 2, 106, 120, '2024-01-09', '2024-01-09 19:15:00+07', 'Al-Baqarah pagi', '2024-01-09 19:15:00+07'),
    (ahmad_user_id, 2, 121, 150, '2024-01-10', '2024-01-10 18:00:00+07', 'Al-Baqarah sore', '2024-01-10 18:00:00+07'),
    (ahmad_user_id, 2, 151, 160, '2024-01-11', '2024-01-11 20:30:00+07', 'Al-Baqarah malam', '2024-01-11 20:30:00+07'),
    (ahmad_user_id, 2, 161, 185, '2024-01-12', '2024-01-12 17:45:00+07', 'Al-Baqarah sore', '2024-01-12 17:45:00+07'),
    -- Missed day 13 Jan
    (ahmad_user_id, 2, 186, 210, '2024-01-14', '2024-01-14 18:30:00+07', 'Al-Baqarah pagi', '2024-01-14 18:30:00+07'),
    (ahmad_user_id, 2, 211, 220, '2024-01-15', '2024-01-15 19:00:00+07', 'Al-Baqarah sore', '2024-01-15 19:00:00+07'),
    (ahmad_user_id, 2, 221, 240, '2024-01-16', '2024-01-16 18:15:00+07', 'Al-Baqarah malam', '2024-01-16 18:15:00+07'),
    (ahmad_user_id, 2, 241, 255, '2024-01-17', '2024-01-17 19:30:00+07', 'Al-Baqarah sore', '2024-01-17 19:30:00+07'),
    (ahmad_user_id, 2, 256, 275, '2024-01-18', '2024-01-18 17:45:00+07', 'Al-Baqarah pagi', '2024-01-18 17:45:00+07'),
    (ahmad_user_id, 2, 276, 285, '2024-01-19', '2024-01-19 18:00:00+07', 'Al-Baqarah sore', '2024-01-19 18:00:00+07'),
    (ahmad_user_id, 2, 286, 286, '2024-01-20', '2024-01-20 18:30:00+07', 'Ayat Kursi - selesai Al-Baqarah', '2024-01-20 18:30:00+07'),
    (ahmad_user_id, 3, 1, 15, '2024-01-21', '2024-01-21 19:15:00+07', 'Ali Imran awal', '2024-01-21 19:15:00+07'),
    (ahmad_user_id, 3, 16, 30, '2024-01-22', '2024-01-22 18:45:00+07', 'Ali Imran lanjutan', '2024-01-22 18:45:00+07'),
    (ahmad_user_id, 3, 31, 45, '2024-01-23', '2024-01-23 18:00:00+07', 'Ali Imran sore', '2024-01-23 18:00:00+07'),
    (ahmad_user_id, 3, 46, 60, '2024-01-24', '2024-01-24 19:30:00+07', 'Ali Imran malam', '2024-01-24 19:30:00+07'),
    (ahmad_user_id, 3, 61, 75, '2024-01-25', '2024-01-25 18:30:00+07', 'Ali Imran pagi', '2024-01-25 18:30:00+07');
    
    -- Sarah's reading sessions if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO reading_sessions (user_id, surah_number, ayat_start, ayat_end, date, session_time, notes, created_at) VALUES
        -- Recent sessions (Jan 2024)
        (sarah_user_id, 1, 1, 7, '2024-01-15', '2024-01-15 05:45:00+07', 'Al-Fatihah pagi', '2024-01-15 05:45:00+07'),
        (sarah_user_id, 2, 1, 5, '2024-01-16', '2024-01-16 05:30:00+07', 'Al-Baqarah awal', '2024-01-16 05:30:00+07'),
        (sarah_user_id, 2, 6, 10, '2024-01-17', '2024-01-17 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-17 05:45:00+07'),
        (sarah_user_id, 2, 11, 15, '2024-01-18', '2024-01-18 05:30:00+07', 'Al-Baqarah pagi', '2024-01-18 05:30:00+07'),
        (sarah_user_id, 2, 16, 20, '2024-01-19', '2024-01-19 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-19 05:45:00+07'),
        (sarah_user_id, 2, 21, 25, '2024-01-20', '2024-01-20 05:30:00+07', 'Al-Baqarah pagi', '2024-01-20 05:30:00+07'),
        (sarah_user_id, 2, 26, 30, '2024-01-21', '2024-01-21 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-21 05:45:00+07'),
        (sarah_user_id, 2, 31, 35, '2024-01-22', '2024-01-22 05:30:00+07', 'Al-Baqarah pagi', '2024-01-22 05:30:00+07'),
        (sarah_user_id, 2, 36, 40, '2024-01-23', '2024-01-23 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-23 05:45:00+07'),
        (sarah_user_id, 2, 41, 45, '2024-01-24', '2024-01-24 05:30:00+07', 'Al-Baqarah pagi', '2024-01-24 05:30:00+07'),
        (sarah_user_id, 2, 46, 50, '2024-01-25', '2024-01-25 05:45:00+07', 'Al-Baqarah lanjutan', '2024-01-25 05:45:00+07');
    END IF;
END $$;

-- =========================================
-- 10. DEVICE TOKENS (untuk notifikasi)
-- =========================================

-- Ahmad's device token
DO $$
DECLARE
    ahmad_user_id uuid;
    sarah_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO ahmad_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO sarah_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Ahmad's device token
    INSERT INTO device_tokens (user_id, token, platform, created_at) VALUES
    (ahmad_user_id, 'ahmad_device_token_12345', 'android', '2024-01-01 08:00:00+07')
    ON CONFLICT (user_id, token) DO UPDATE SET
        platform = EXCLUDED.platform,
        created_at = EXCLUDED.created_at;
    
    -- Sarah's device token if second user exists
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO device_tokens (user_id, token, platform, created_at) VALUES
        (sarah_user_id, 'sarah_device_token_67890', 'ios', '2024-01-15 10:30:00+07')
        ON CONFLICT (user_id, token) DO UPDATE SET
            platform = EXCLUDED.platform,
            created_at = EXCLUDED.created_at;
    END IF;
END $$;

-- =========================================
-- 11. INVITE CODES (untuk testing family invite)
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

-- Show user IDs being used
SELECT 'User IDs' as info, 
       (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as ahmad_id,
       (SELECT id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1) as sarah_id;

-- Verify data has been inserted correctly
WITH user_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM auth.users
    ORDER BY created_at
    LIMIT 2
)
SELECT 'Profiles' as table_name, count(*) as count 
FROM profiles p
JOIN user_ids u ON (p.id = u.id OR p.user_id = u.id)
WHERE u.rn <= 2
UNION ALL
SELECT 'User Settings', count(*) 
FROM user_settings us
JOIN user_ids u ON us.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Families', count(*) FROM families WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
UNION ALL
SELECT 'Family Members', count(*) FROM family_members WHERE family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
UNION ALL
SELECT 'Reading Progress', count(*) 
FROM reading_progress rp
JOIN user_ids u ON rp.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Streaks', count(*) 
FROM streaks s
JOIN user_ids u ON s.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Checkins', count(*) 
FROM checkins c
JOIN user_ids u ON c.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Reading Sessions', count(*) 
FROM reading_sessions rs
JOIN user_ids u ON rs.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Device Tokens', count(*) 
FROM device_tokens dt
JOIN user_ids u ON dt.user_id = u.id
WHERE u.rn <= 2
UNION ALL
SELECT 'Invite Codes', count(*) FROM invite_codes WHERE family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
