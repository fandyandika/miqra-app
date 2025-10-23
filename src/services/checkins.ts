import { supabase } from '@/lib/supabase';
import { getTodayDate } from '@/utils/time';

export interface CheckinPayload {
  date: string; // yyyy-MM-dd
  ayat_count: number;
}

export async function upsertCheckin(payload: CheckinPayload, timezone: string = 'Asia/Jakarta') {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Validate date - prevent future dates
  const today = getTodayDate(timezone);
  if (payload.date > today) {
    throw new Error('Tidak bisa mencatat bacaan untuk tanggal yang akan datang');
  }

  const { data, error } = await supabase
    .from('checkins')
    .upsert(
      { user_id: userId, date: payload.date, ayat_count: payload.ayat_count },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Checkin] Upsert error:', error);
    throw error;
  }

  const { error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
    checkin_date: payload.date,
  });
  if (rpcError) console.warn('[Checkin] RPC streak update error:', rpcError);

  return data;
}

export async function getTodayCheckin(timezone: string = 'Asia/Jakarta') {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const today = getTodayDate(timezone);
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.warn('[Checkin] Fetch today error:', error);
    return null;
  }
  return data;
}

export async function getCurrentStreak() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return { current: 0, longest: 0, last_date: null as string | null };

  console.log('[getCurrentStreak] Fetching streak for user:', userId);

  // First, let's check the raw checkins data
  const { data: checkinsData } = await supabase
    .from('checkins')
    .select('date, ayat_count')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  console.log('[getCurrentStreak] Raw checkins data:', checkinsData);

  const { data, error } = await supabase
    .from('streaks')
    .select('current, longest, last_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Streak] Fetch error:', error);
    return { current: 0, longest: 0, last_date: null };
  }

  const result = data || { current: 0, longest: 0, last_date: null };
  console.log('[getCurrentStreak] Streak table result for user', userId, ':', result);

  // If we have checkins but streak is 0 or 1, try to recalculate
  if (checkinsData && checkinsData.length >= 2 && result.current <= 1) {
    console.log('[getCurrentStreak] Attempting to recalculate streak...');
    // Trigger streak recalculation for the most recent checkin
    const lastCheckin = checkinsData[checkinsData.length - 1];
    const { error: rpcError } = await supabase.rpc('update_streak_after_checkin', {
      checkin_date: lastCheckin.date,
    });

    if (rpcError) {
      console.warn('[getCurrentStreak] RPC error during recalculation:', rpcError);
      // If RPC fails, try manual calculation
      console.log('[getCurrentStreak] Attempting manual streak calculation...');
      const manualStreak = calculateStreakManually(checkinsData);
      console.log('[getCurrentStreak] Manual calculation result:', manualStreak);
      return manualStreak;
    } else {
      console.log('[getCurrentStreak] Streak recalculated, fetching updated data...');
      // Fetch updated streak data
      const { data: updatedData } = await supabase
        .from('streaks')
        .select('current, longest, last_date')
        .eq('user_id', userId)
        .maybeSingle();

      if (updatedData) {
        console.log('[getCurrentStreak] Updated streak data:', updatedData);
        return updatedData;
      }
    }
  }

  return result;
}

// Manual streak calculation as fallback
function calculateStreakManually(checkinsData: any[]) {
  if (!checkinsData || checkinsData.length === 0) {
    return { current: 0, longest: 0, last_date: null };
  }

  // Sort by date
  const sortedCheckins = [...checkinsData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentStreak = 1;
  let longestStreak = 1;
  let lastDate = new Date(sortedCheckins[sortedCheckins.length - 1].date);

  // Calculate consecutive days from the end
  for (let i = sortedCheckins.length - 2; i >= 0; i--) {
    const currentDate = new Date(sortedCheckins[i].date);
    const prevDate = new Date(sortedCheckins[i + 1].date);

    // Check if dates are consecutive
    const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
    } else {
      // Streak broken, check if this was the longest
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      currentStreak = 1;
    }
  }

  // Check if the final streak is the longest
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    last_date: lastDate.toISOString().split('T')[0],
  };
}
