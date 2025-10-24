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
  if (!userId) {
    console.log('[getCurrentStreak] No user ID found');
    return { current: 0, longest: 0, last_date: null as string | null };
  }

  console.log('[getCurrentStreak] 🔍 Fetching streak for user:', userId);

  // First, let's check the raw checkins data
  const { data: checkinsData, error: checkinsError } = await supabase
    .from('checkins')
    .select('date, ayat_count')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (checkinsError) {
    console.error('[getCurrentStreak] Checkins error:', checkinsError);
    return { current: 0, longest: 0, last_date: null };
  }

  console.log('[getCurrentStreak] 📊 Raw checkins data:', checkinsData);

  const { data, error } = await supabase
    .from('streaks')
    .select('current, longest, last_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[getCurrentStreak] Streak fetch error:', error);
    return { current: 0, longest: 0, last_date: null };
  }

  const existing = data || { current: 0, longest: 0, last_date: null };
  console.log('[getCurrentStreak] ⚡ Streak table result for user', userId, ':', existing);

  // Always compute manual streak from checkins to avoid stale streak values
  if (checkinsData && checkinsData.length > 0) {
    const manual = calculateStreakManually(checkinsData);

    // If last checkin is older than yesterday, current streak should be 0
    try {
      const todayStr = getTodayDate();
      const msPerDay = 24 * 60 * 60 * 1000;
      const lastMs = new Date(manual.last_date as string).getTime();
      const todayMs = new Date(todayStr).getTime();
      const gapDays = Math.floor((todayMs - lastMs) / msPerDay);
      if (gapDays >= 2) {
        manual.current = 0;
      }
    } catch (e) {
      // ignore parse issues; keep manual value
    }

    // If manual differs from existing, upsert to DB for consistency
    if (
      manual.current !== existing.current ||
      manual.last_date !== existing.last_date ||
      (existing.longest ?? 0) < (manual.longest ?? 0)
    ) {
      try {
        await supabase.from('streaks').upsert(
          {
            user_id: userId,
            current: manual.current,
            longest: manual.longest,
            last_date: manual.last_date,
          },
          { onConflict: 'user_id' }
        );
        console.log('[getCurrentStreak] 🔄 Upserted corrected streak:', manual);
      } catch (e) {
        console.warn('[getCurrentStreak] ⚠️ Failed to upsert corrected streak:', e);
      }
    }

    console.log('[getCurrentStreak] 📤 Returning manual streak:', manual);
    return manual;
  }

  console.log('[getCurrentStreak] 📤 Returning existing streak (no checkins):', existing);
  return existing;
}

// Manual streak calculation as fallback
function calculateStreakManually(checkinsData: any[]) {
  if (!checkinsData || checkinsData.length === 0) {
    return { current: 0, longest: 0, last_date: null };
  }

  // Sort by date and deduplicate by date (multiple sessions in the same day count as one)
  const sorted = [...checkinsData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => c.date);
  const uniqueDates: string[] = Array.from(new Set(sorted));

  let currentStreak = 1; // First day always counts as streak 1
  let longestStreak = 1;
  const lastDateStr = uniqueDates[uniqueDates.length - 1];
  const lastDate = new Date(lastDateStr);

  console.log('[calculateStreakManually] Evaluating', uniqueDates.length, 'unique days');

  // Walk backwards over unique dates to count consecutive days
  for (let i = uniqueDates.length - 2; i >= 0; i--) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i + 1]);
    const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
    } else if (dayDiff > 1) {
      if (currentStreak > longestStreak) longestStreak = currentStreak;
      currentStreak = 1;
    }
    // if dayDiff === 0 (same day due to duplicates), already removed by uniqueDates
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  const result = {
    current: currentStreak,
    longest: longestStreak,
    last_date: lastDate.toISOString().split('T')[0],
  };

  return result;
}
