import { supabase } from '@/lib/supabase';
import { subDays, format, eachDayOfInterval } from 'date-fns';

// =========================================
// TYPE DEFINITIONS
// =========================================

export type DailyStats = {
  date: string; // YYYY-MM-DD
  ayat_count: number;
  session_count: number;
};

export type WeeklyStats = {
  week_start: string; // YYYY-MM-DD
  total_ayat: number;
  avg_ayat_per_day: number;
  days_active: number;
};

export type MonthlyStats = {
  month: string; // YYYY-MM
  total_ayat: number;
  avg_ayat_per_day: number;
  days_active: number;
  total_days: number;
};

export type ReadingPattern = {
  hour: number; // 0-23
  count: number;
  avg_ayat: number;
};

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type UserTotalStats = {
  total_ayat: number;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
};

export type FamilyStats = {
  total_family_ayat: number;
  avg_ayat_per_member: number;
  member_count: number;
};

export type ComparativeStats = {
  personal: UserTotalStats;
  family: FamilyStats | null;
};

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Get authenticated user ID or throw error
 */
const getAuthUserId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Auth error:', error);
    throw new Error('Authentication failed');
  }

  if (!user) {
    throw new Error('Not authenticated');
  }

  return user.id;
};

/**
 * Handle RPC errors with logging
 */
const handleRPCError = (functionName: string, error: any): never => {
  console.error(`❌ ${functionName} error:`, error);
  throw new Error(`${functionName} failed: ${error.message || 'Unknown error'}`);
};

// =========================================
// ANALYTICS FUNCTIONS
// =========================================

/**
 * Get daily reading stats for a date range (inclusive)
 */
export async function getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]> {
  const userId = await getAuthUserId();

  console.log('📊 Fetching daily stats:', {
    userId,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });

  const { data, error } = await supabase.rpc('get_daily_stats', {
    p_user_id: userId,
    p_start_date: format(startDate, 'yyyy-MM-dd'),
    p_end_date: format(endDate, 'yyyy-MM-dd'),
  });

  if (error) handleRPCError('getDailyStats', error);

  const result = (data ?? []) as DailyStats[];
  console.log('✅ Daily stats fetched:', result.length, 'days');

  return result;
}

/**
 * Get weekly aggregated stats for last N weeks
 */
export async function getWeeklyStats(weeks: number = 8): Promise<WeeklyStats[]> {
  const userId = await getAuthUserId();
  const endDate = new Date();
  const startDate = subDays(endDate, weeks * 7);

  console.log('📊 Fetching weekly stats:', { userId, weeks });

  const { data, error } = await supabase.rpc('get_weekly_stats', {
    p_user_id: userId,
    p_start_date: format(startDate, 'yyyy-MM-dd'),
    p_end_date: format(endDate, 'yyyy-MM-dd'),
  });

  if (error) handleRPCError('getWeeklyStats', error);

  const result = (data ?? []) as WeeklyStats[];
  console.log('✅ Weekly stats fetched:', result.length, 'weeks');

  return result;
}

/**
 * Get monthly aggregated stats for last N months (including current)
 */
export async function getMonthlyStats(months: number = 6): Promise<MonthlyStats[]> {
  const userId = await getAuthUserId();

  console.log('📊 Fetching monthly stats:', { userId, months });

  const { data, error } = await supabase.rpc('get_monthly_stats', {
    p_user_id: userId,
    p_months: months,
  });

  if (error) handleRPCError('getMonthlyStats', error);

  const result = (data ?? []) as MonthlyStats[];
  console.log('✅ Monthly stats fetched:', result.length, 'months');

  return result;
}

/**
 * Get reading pattern by hour of day (last 30 days)
 * Light client-side aggregation for hourly bins
 */
export async function getReadingPattern(): Promise<ReadingPattern[]> {
  const userId = await getAuthUserId();
  const sinceDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  console.log('📊 Fetching reading pattern:', { userId, sinceDate });

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('session_time, created_at, ayat_count')
    .eq('user_id', userId)
    .gte('created_at', sinceDate);

  if (error) {
    console.error('❌ Reading pattern error:', error);
    throw error;
  }

  // Initialize 24-hour bins
  const hourBins: Record<number, { count: number; totalAyat: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourBins[h] = { count: 0, totalAyat: 0 };
  }

  // Aggregate by hour
  (data ?? []).forEach((session: any) => {
    const timestamp = session.session_time ?? session.created_at;
    const hour = new Date(timestamp).getHours();

    hourBins[hour].count += 1;
    hourBins[hour].totalAyat += session.ayat_count ?? 0;
  });

  // Convert to array
  const result: ReadingPattern[] = Array.from({ length: 24 }, (_, hour) => {
    const bin = hourBins[hour];
    return {
      hour,
      count: bin.count,
      avg_ayat: bin.count > 0 ? bin.totalAyat / bin.count : 0,
    };
  });

  console.log(
    '✅ Reading pattern fetched:',
    result.filter((r) => r.count > 0).length,
    'active hours'
  );

  return result;
}

/**
 * Get year-long heatmap data (365 days) with intensity levels
 * GitHub-style contribution grid
 */
export async function getYearHeatmap(): Promise<HeatmapDay[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  console.log('📊 Fetching year heatmap');

  // Get daily stats for the year
  const dailyStats = await getDailyStats(startDate, endDate);

  // Create lookup map
  const statsMap = new Map(dailyStats.map((stat) => [stat.date, stat.ayat_count]));

  // Generate all days in range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate quartiles for intensity levels
  const counts = dailyStats
    .map((s) => s.ayat_count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  const getQuartile = (percentage: number): number => {
    if (counts.length === 0) return 0;
    const index = Math.floor(counts.length * percentage);
    return counts[index] || 0;
  };

  const q1 = getQuartile(0.25) || 1;
  const q2 = getQuartile(0.5) || 5;
  const q3 = getQuartile(0.75) || 10;

  // Map to heatmap format with intensity levels
  const result: HeatmapDay[] = allDays.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = statsMap.get(dateStr) ?? 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count === 0) level = 0;
    else if (count <= q1) level = 1;
    else if (count <= q2) level = 2;
    else if (count <= q3) level = 3;
    else level = 4;

    return { date: dateStr, count, level };
  });

  console.log('✅ Heatmap generated:', result.length, 'days');
  console.log('🔍 Debug - Quartiles:', { q1, q2, q3 });
  console.log('🔍 Debug - Sample data with levels:', result.slice(0, 10));
  console.log('🔍 Debug - Days with level > 0:', result.filter((d) => d.level > 0).slice(0, 10));

  return result;
}

/**
 * Get user's total statistics (including streaks)
 */
export async function getUserTotalStats(): Promise<UserTotalStats> {
  const userId = await getAuthUserId();

  console.log('📊 Fetching user total stats:', { userId });

  const { data, error } = await supabase.rpc('get_user_total_stats', {
    p_user_id: userId,
  });

  if (error) handleRPCError('getUserTotalStats', error);

  const result = data as UserTotalStats;
  console.log('✅ User stats fetched:', result);
  console.log('🔍 Debug - current_streak value:', result?.current_streak);
  console.log('🔍 Debug - full data structure:', JSON.stringify(result, null, 2));

  return result;
}

/**
 * Get comparative stats (personal vs family if in a family)
 */
export async function getComparativeStats(): Promise<ComparativeStats> {
  const userId = await getAuthUserId();

  console.log('📊 Fetching comparative stats:', { userId });

  // Check if user is in a family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .maybeSingle();

  // Get personal stats
  const personal = await getUserTotalStats();
  console.log('🔍 Debug - Personal stats in comparative:', personal);

  // If not in family, return with null family stats
  if (!familyMember?.family_id) {
    console.log('✅ User not in family, returning personal stats only');
    return { personal, family: null };
  }

  // Get family stats
  const { data: familyData, error: familyError } = await supabase.rpc('get_family_stats', {
    p_family_id: familyMember.family_id,
  });

  if (familyError) {
    console.error('❌ Family stats error:', familyError);
    return { personal, family: null };
  }

  const family = familyData as FamilyStats;
  console.log('✅ Comparative stats fetched:', { personal, family });
  console.log('🔍 Debug - Family data raw:', familyData);
  console.log('🔍 Debug - Family stats processed:', family);

  return { personal, family };
}

// =========================================
// REACT QUERY KEYS (for cache management)
// =========================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  daily: (start: Date, end: Date) =>
    [
      ...analyticsKeys.all,
      'daily',
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd'),
    ] as const,
  weekly: (weeks: number) => [...analyticsKeys.all, 'weekly', weeks] as const,
  monthly: (months: number) => [...analyticsKeys.all, 'monthly', months] as const,
  pattern: () => [...analyticsKeys.all, 'pattern'] as const,
  heatmap: () => [...analyticsKeys.all, 'heatmap'] as const,
  userTotal: () => [...analyticsKeys.all, 'userTotal'] as const,
  comparative: () => [...analyticsKeys.all, 'comparative'] as const,
};
