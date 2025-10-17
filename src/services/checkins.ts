import { supabase } from '@/lib/supabase';
import { getTodayDate } from '@/utils/time';

export interface CheckinPayload {
  date: string; // yyyy-MM-dd
  ayat_count: number;
}

export async function upsertCheckin(payload: CheckinPayload) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

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

export async function getTodayCheckin() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const today = getTodayDate();
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

  const { data, error } = await supabase
    .from('streaks')
    .select('current, longest, last_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Streak] Fetch error:', error);
    return { current: 0, longest: 0, last_date: null };
  }
  return data || { current: 0, longest: 0, last_date: null };
}


