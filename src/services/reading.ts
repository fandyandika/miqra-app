import { supabase } from '@/lib/supabase';
import {
  formatISO,
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getAyatCount, getNextPosition } from '@/data/quran_meta';
import { calculateUniqueAyatProgress, getNextUnreadPosition } from '@/lib/uniqueAyatTracker';

export type ReadingSessionInput = {
  surah_number: number;
  ayat_start: number;
  ayat_end: number;
  date?: string; // YYYY-MM-DD
  session_time?: string; // ISO
  notes?: string;
};

type ReadingProgress = {
  user_id: string;
  current_surah: number;
  current_ayat: number;
  total_ayat_read: number;
  khatam_count: number;
  last_read_at?: string | null;
};

export async function getReadingProgress() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return (
    (data as ReadingProgress) ?? {
      user_id: user.id,
      current_surah: 1,
      current_ayat: 1,
      total_ayat_read: 0,
      khatam_count: 0,
    }
  );
}

export function getNextPositionFrom(progress: { current_surah: number; current_ayat: number }) {
  return getNextPosition(progress.current_surah, progress.current_ayat);
}

export async function getTodaySessions(timezone: string = 'Asia/Jakarta') {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Use timezone-aware date calculation with fallback
  const now = new Date();
  let today: string;

  try {
    const jakartaTime = toZonedTime(now, timezone);
    if (isNaN(jakartaTime.getTime())) {
      throw new Error('Invalid timezone conversion result');
    }
    today = format(jakartaTime, 'yyyy-MM-dd');
    console.log('[getTodaySessions] Today date (Jakarta):', today);
  } catch (timezoneError) {
    console.warn('[getTodaySessions] Timezone conversion failed, using local date:', timezoneError);
    // Fallback to local date if timezone conversion fails
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours for Jakarta time
    today = format(localDate, 'yyyy-MM-dd');
    console.log('[getTodaySessions] Today date (fallback):', today);
  }

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('id,surah_number,ayat_start,ayat_end,ayat_count,session_time,notes')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('session_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSessionsInRange(startDate: string, endDate: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('id,date,surah_number,ayat_start,ayat_end,ayat_count,session_time,notes')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('session_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReadingSession(
  input: ReadingSessionInput,
  timezone: string = 'Asia/Jakarta'
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Validate length
  const maxAyat = getAyatCount(input.surah_number);
  if (input.ayat_end > maxAyat) throw new Error('Ayat end exceeds surah length');

  // Use timezone-aware date handling with fallback
  const now = new Date();
  console.log('[createReadingSession] Current time:', now.toISOString());

  // Validate date first
  if (isNaN(now.getTime())) {
    throw new Error('Invalid current time');
  }

  let todayDate: string;

  try {
    // Try timezone conversion first
    const jakartaTime = toZonedTime(now, timezone);
    if (isNaN(jakartaTime.getTime())) {
      throw new Error('Invalid timezone conversion result');
    }
    todayDate = format(jakartaTime, 'yyyy-MM-dd');
    console.log('[createReadingSession] Today date (Jakarta):', todayDate);
  } catch (timezoneError) {
    console.warn(
      '[createReadingSession] Timezone conversion failed, using local date:',
      timezoneError
    );
    // Fallback to local date if timezone conversion fails
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours for Jakarta time
    todayDate = format(localDate, 'yyyy-MM-dd');
    console.log('[createReadingSession] Today date (fallback):', todayDate);
  }

  const inputDate = input.date ?? todayDate;
  console.log('[createReadingSession] Input date:', inputDate);

  if (inputDate > todayDate) {
    throw new Error('Tidak bisa mencatat bacaan untuk tanggal yang akan datang');
  }

  const payload = {
    user_id: user.id,
    surah_number: input.surah_number,
    ayat_start: input.ayat_start,
    ayat_end: input.ayat_end,
    date: inputDate,
    session_time: input.session_time ?? new Date().toISOString(),
    notes: input.notes ?? null,
  };

  // Insert session
  const { data: inserted, error } = await supabase
    .from('reading_sessions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;

  const ayatCount = (inserted.ayat_end as number) - (inserted.ayat_start as number) + 1;

  // Fetch existing progress
  const progress = await getReadingProgress();

  // Forward-only progress update
  const isForward =
    (inserted.surah_number as number) > progress.current_surah ||
    ((inserted.surah_number as number) === progress.current_surah &&
      (inserted.ayat_end as number) >= progress.current_ayat);

  const patch: any = {
    user_id: user.id,
    total_ayat_read: (progress.total_ayat_read ?? 0) + ayatCount,
    last_read_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isForward) {
    const next = getNextPosition(inserted.surah_number as number, inserted.ayat_end as number);
    patch.current_surah = next.surah;
    patch.current_ayat = next.ayat;
    patch.khatam_count = (progress.khatam_count ?? 0) + (next.khatam ? 1 : 0);
  }

  const { error: upErr } = await supabase.from('reading_progress').upsert(patch);
  if (upErr) throw upErr;

  // Cumulative check-in for today (using same date as above)
  const todayCheckin = todayDate;
  console.log('[createReadingSession] Checkin date:', todayCheckin);

  // Get existing checkin for today to add to it
  const { data: existingCheckin } = await supabase
    .from('checkins')
    .select('ayat_count')
    .eq('user_id', user.id)
    .eq('date', todayCheckin)
    .single();

  const existingCount = existingCheckin?.ayat_count || 0;
  const todayTotal = existingCount + ayatCount;

  await supabase
    .from('checkins')
    .upsert(
      { user_id: user.id, date: todayCheckin, ayat_count: todayTotal },
      { onConflict: 'user_id,date' }
    );

  return inserted;
}

// ======== APPENDED HELPERS: history, stats, calendar ========

/**
 * Return all sessions for the month of the given date.
 */
export async function getMonthSessions(date: Date = new Date(), timezone: string = 'Asia/Jakarta') {
  const start = format(startOfMonth(date), 'yyyy-MM-dd');
  const end = format(endOfMonth(date), 'yyyy-MM-dd');
  return getSessionsInRange(start, end);
}

/**
 * Compute stats for a date range [startDate..endDate]
 * Uses both reading_sessions and checkins for accurate reading days count
 */
export async function getReadingStats(
  startDate: string,
  endDate: string,
  timezone: string = 'Asia/Jakarta'
) {
  console.log('🔍 [getReadingStats] Called with:', {
    startDate,
    endDate,
    timezone,
  });

  // Get current user ID
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  console.log('🔍 [getReadingStats] User ID:', userId);

  if (!userId) {
    console.log('❌ [getReadingStats] No user ID found');
    return {
      totalAyat: 0,
      totalSessions: 0,
      daysRead: 0,
      avgPerDay: 0,
      mostReadSurah: null,
    };
  }

  // Get reading sessions for this user in the date range
  const sessions = await getSessionsInRange(startDate, endDate);
  const totalSessions = (sessions || []).length;
  console.log('📚 [getReadingStats] Sessions found:', totalSessions);

  // Calculate total ayat from sessions (source of truth per user)
  const totalAyat = (sessions || []).reduce((sum, s) => sum + (s.ayat_count || 0), 0);
  console.log('📊 [getReadingStats] Total ayat from sessions:', totalAyat);

  // Calculate unique reading days from sessions
  const daysRead = new Set((sessions || []).map((s) => s.date)).size;
  console.log('📅 [getReadingStats] Days read from sessions:', daysRead);

  const avgPerDay = daysRead > 0 ? Math.round(totalAyat / daysRead) : 0;
  console.log('📈 [getReadingStats] Average per day:', avgPerDay);

  const result = {
    totalAyat,
    totalSessions,
    daysRead,
    avgPerDay,
    mostReadSurah: null, // deprecated in UI – replaced by Statistik Detail
  };

  console.log('✅ [getReadingStats] Final result:', result);
  return result;
}

/**
 * Calendar data for a given month: map of dateStr -> summary
 */
export async function getCalendarData(date: Date = new Date(), timezone: string = 'Asia/Jakarta') {
  // Prefer checkins to render calendar consistency with streak
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  const start = format(startOfMonth(date), 'yyyy-MM-dd');
  const end = format(endOfMonth(date), 'yyyy-MM-dd');

  let dateMap: Record<string, { count: number; ayatCount: number; sessions: any[] }> = {};

  if (userId) {
    const { data: checkinData } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);
    (checkinData ?? []).forEach((c: any) => {
      if (!dateMap[c.date]) dateMap[c.date] = { count: 0, ayatCount: 0, sessions: [] };
      dateMap[c.date].count += 1;
      dateMap[c.date].ayatCount += c.ayat_count || 0;
    });
  }

  // Fallback to sessions if there are no checkins (e.g., legacy data)
  if (Object.keys(dateMap).length === 0) {
    const sessions = await getMonthSessions(date, timezone);
    dateMap = (sessions || []).reduce(
      (acc: Record<string, { count: number; ayatCount: number; sessions: any[] }>, s: any) => {
        const key = s.date as string;
        if (!acc[key]) acc[key] = { count: 0, ayatCount: 0, sessions: [] };
        acc[key].count += 1;
        acc[key].ayatCount += s.ayat_count || 0;
        acc[key].sessions.push(s);
        return acc;
      },
      {} as Record<string, { count: number; ayatCount: number; sessions: any[] }>
    );
  }

  return dateMap;
}

/**
 * Group sessions by date (descending) for list rendering
 */
export function groupSessionsByDate(sessions: any[]) {
  const groups = (sessions || []).reduce(
    (acc: Record<string, any[]>, s: any) => {
      const key = s.date as string;
      (acc[key] ||= []).push(s);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      sessions: list,
      totalAyat: ((list as any[]) || []).reduce(
        (sum: number, s: any) => sum + (s.ayat_count || 0),
        0
      ),
    }));
}

/**
 * Get recent reading sessions for ProgressScreen reading list
 * Returns last 10 days of reading sessions with session count per day
 */
export async function getRecentReadingSessions(limit: number = 10) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Get sessions from last 30 days to ensure we have enough data
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: sessions, error } = await supabase
    .from('reading_sessions')
    .select('id, date, surah_number, ayat_start, ayat_end, ayat_count, session_time, notes')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo)
    .lte('date', today)
    .order('date', { ascending: false })
    .order('session_time', { ascending: true }); // Changed to ascending for earliest first

  if (error) throw error;

  // Group sessions by date and calculate session count per day
  const groupedSessions = groupSessionsByDate(sessions || []);

  // Take only the requested limit
  return groupedSessions.slice(0, limit).map((dayData) => ({
    date: dayData.date,
    ayat_count: dayData.totalAyat,
    session_count: dayData.sessions.length,
    sessions: dayData.sessions,
    surah_name: dayData.sessions[0]?.surah_number
      ? `Surah ${dayData.sessions[0].surah_number}`
      : 'Surah tidak diketahui',
    ayat_start: dayData.sessions[0]?.ayat_start || 1,
    ayat_end: dayData.sessions[0]?.ayat_end || dayData.totalAyat,
  }));
}

/**
 * Aggregate data for khatam tracker (progress + recent 30d sessions)
 */
export async function getKhatamProgress() {
  try {
    console.log('[getKhatamProgress] Starting...');
    const progress = await getReadingProgress();
    console.log('[getKhatamProgress] Progress loaded:', !!progress);

    // Get ALL sessions to calculate unique ayat progress
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data: allSessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('session_time', { ascending: true }); // Chronological order for unique tracking

    if (sessionsError) throw sessionsError;

    // Calculate unique ayat progress (no repeats)
    const uniqueData = calculateUniqueAyatProgress(allSessions || []);

    // Get next unread position for better tracking
    const nextPosition = getNextUnreadPosition(
      uniqueData.uniquePositions,
      progress.current_surah,
      progress.current_ayat
    );

    // Update progress with unique data
    const updatedProgress = {
      ...progress,
      total_ayat_read: uniqueData.totalUniqueAyat,
      khatam_count: uniqueData.khatamCount,
      current_surah: nextPosition.surah,
      current_ayat: nextPosition.ayat,
    };

    // Get recent 30 days for estimation
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const end = format(new Date(), 'yyyy-MM-dd');
    const recentSessions =
      allSessions?.filter((session) => session.date >= start && session.date <= end) || [];

    console.log('[getKhatamProgress] Unique ayat read:', uniqueData.totalUniqueAyat);
    console.log('[getKhatamProgress] Khatam count:', uniqueData.khatamCount);
    console.log('[getKhatamProgress] Next position:', nextPosition.surah, ':', nextPosition.ayat);
    console.log('[getKhatamProgress] Recent sessions (30d):', recentSessions.length);

    return {
      progress: updatedProgress,
      recentSessions,
      uniqueData,
    };
  } catch (error) {
    console.error('[getKhatamProgress] Error:', error);

    // Return fallback data instead of throwing
    const fallbackProgress = {
      user_id: '',
      current_surah: 1,
      current_ayat: 1,
      total_ayat_read: 0,
      khatam_count: 0,
      last_read_at: null,
    };

    return {
      progress: fallbackProgress,
      recentSessions: [],
      uniqueData: null,
    };
  }
}
