import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import countsJson from '@/data/letter-counts-precise.json';

const MAP: Record<string, number> = (countsJson as any).data || {};
const HASANAT_PER_LETTER = 10;

export interface DailyHasanat {
  id: string;
  user_id: string;
  date: string;
  total_letters: number;
  total_hasanat: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface HasanatStats {
  total_hasanat: number;
  total_letters: number;
  total_sessions: number;
  daily_average: number;
  streak_days: number;
  longest_streak: number;
}

export interface HasanatPreview {
  letterCount: number;
  hasanat: number;
}

export interface TotalHasanat {
  totalLetters: number;
  totalHasanat: number;
  totalSessions: number;
}

export interface DailyHasanatData {
  date: string;
  totalLetters: number;
  totalHasanat: number;
  sessionCount: number;
}

// Fallback kalkulasi di client (untuk preview/alert). Data resmi tetap dari DB.
export function previewHasanatForRange(
  surah: number,
  ayahStart: number,
  ayahEnd: number
): HasanatPreview {
  let letters = 0;
  for (let a = ayahStart; a <= ayahEnd; a++) {
    const key = `${surah}:${a}`;
    letters += MAP[key] || 0;
  }
  return {
    letterCount: letters,
    hasanat: letters * HASANAT_PER_LETTER,
  };
}

// Total hasanat sepanjang waktu (dari DB)
export async function getUserTotalHasanat(): Promise<TotalHasanat> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { totalLetters: 0, totalHasanat: 0, totalSessions: 0 };

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('letter_count, hasanat_earned')
    .eq('user_id', user.id);

  if (error || !data) return { totalLetters: 0, totalHasanat: 0, totalSessions: 0 };

  const totalLetters = data.reduce((s, r) => s + (r.letter_count || 0), 0);
  const totalHasanat = data.reduce((s, r) => s + (r.hasanat_earned || 0), 0);

  return {
    totalLetters,
    totalHasanat,
    totalSessions: data.length,
  };
}

// Breakdown harian (default 30 hari)
export async function getDailyHasanat(days = 30): Promise<DailyHasanatData[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('daily_hasanat')
    .select('date, total_letters, total_hasanat, session_count')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: true });

  if (error || !data) return [];

  return data.map((d) => ({
    date: d.date,
    totalLetters: d.total_letters,
    totalHasanat: d.total_hasanat,
    sessionCount: d.session_count,
  }));
}

/**
 * Get daily hasanat for a user in a date range (legacy function)
 */
export async function getDailyHasanatRange(
  startDate: string,
  endDate: string
): Promise<DailyHasanat[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('daily_hasanat')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get hasanat statistics for a user
 */
export async function getHasanatStats(): Promise<HasanatStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Get total stats
  const { data: totalData, error: totalError } = await supabase
    .from('daily_hasanat')
    .select('total_hasanat, total_letters, session_count')
    .eq('user_id', user.id);

  if (totalError) throw totalError;

  const total_hasanat = totalData?.reduce((sum, day) => sum + (day.total_hasanat || 0), 0) || 0;
  const total_letters = totalData?.reduce((sum, day) => sum + (day.total_letters || 0), 0) || 0;
  const total_sessions = totalData?.reduce((sum, day) => sum + (day.session_count || 0), 0) || 0;
  const daily_count = totalData?.length || 0;
  const daily_average = daily_count > 0 ? Math.round(total_hasanat / daily_count) : 0;

  // Get streak data
  const { data: streakData, error: streakError } = await supabase
    .from('daily_hasanat')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (streakError) throw streakError;

  // Calculate current streak
  let streak_days = 0;
  let longest_streak = 0;
  let current_streak = 0;
  let last_date: Date | null = null;

  if (streakData && streakData.length > 0) {
    for (const day of streakData) {
      const day_date = new Date(day.date);

      if (last_date === null) {
        // First day
        current_streak = 1;
        last_date = day_date;
      } else {
        const days_diff = Math.floor(
          (last_date.getTime() - day_date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (days_diff === 1) {
          // Consecutive day
          current_streak++;
          last_date = day_date;
        } else {
          // Streak broken
          longest_streak = Math.max(longest_streak, current_streak);
          current_streak = 1;
          last_date = day_date;
        }
      }
    }

    // Check if current streak is still active (today or yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last_day = new Date(streakData[0].date);
    const days_since_last = Math.floor(
      (today.getTime() - last_day.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days_since_last <= 1) {
      streak_days = current_streak;
    } else {
      streak_days = 0;
    }

    longest_streak = Math.max(longest_streak, current_streak);
  }

  return {
    total_hasanat,
    total_letters,
    total_sessions,
    daily_average,
    streak_days,
    longest_streak,
  };
}

/**
 * Get hasanat leaderboard for family
 */
export async function getHasanatLeaderboard(familyId?: string): Promise<{
  personal: HasanatStats;
  family: {
    user_id: string;
    name: string;
    total_hasanat: number;
    total_letters: number;
    streak_days: number;
  }[];
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Get personal stats
  const personal = await getHasanatStats();

  // Get family stats if familyId provided
  let family: any[] = [];

  if (familyId) {
    const { data: familyData, error: familyError } = await supabase
      .from('family_members')
      .select(
        `
        user_id,
        profiles!inner(name)
      `
      )
      .eq('family_id', familyId);

    if (familyError) throw familyError;

    if (familyData && familyData.length > 0) {
      const userIds = familyData.map((member) => member.user_id);

      const { data: hasanatData, error: hasanatError } = await supabase
        .from('daily_hasanat')
        .select('user_id, total_hasanat, total_letters')
        .in('user_id', userIds);

      if (hasanatError) throw hasanatError;

      // Aggregate by user
      const userStats = new Map();

      hasanatData?.forEach((day) => {
        const userId = day.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            total_hasanat: 0,
            total_letters: 0,
            streak_days: 0,
          });
        }

        const stats = userStats.get(userId);
        stats.total_hasanat += day.total_hasanat || 0;
        stats.total_letters += day.total_letters || 0;
      });

      // Add names and calculate streaks
      family = familyData
        .map((member) => {
          const stats = userStats.get(member.user_id) || {
            user_id: member.user_id,
            total_hasanat: 0,
            total_letters: 0,
            streak_days: 0,
          };

          return {
            ...stats,
            name: (member.profiles as any)?.name || 'Unknown',
          };
        })
        .sort((a, b) => b.total_hasanat - a.total_hasanat);
    }
  }

  return {
    personal,
    family,
  };
}

/**
 * Rebuild hasanat data for current user (admin function)
 */
export async function rebuildUserHasanat(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { error } = await supabase.rpc('rebuild_daily_hasanat_for_user', {
    p_user: user.id,
  });

  if (error) throw error;
}
