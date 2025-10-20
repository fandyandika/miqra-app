import { supabase } from '@/lib/supabase';
import { formatISO } from 'date-fns';
import { getAyatCount, getNextPosition } from '@/data/quran_meta';

export type ReadingSessionInput = {
  surah_number: number;
  ayat_start: number;
  ayat_end: number;
  date?: string;         // YYYY-MM-DD
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as ReadingProgress) ?? { user_id: user.id, current_surah: 1, current_ayat: 1, total_ayat_read: 0, khatam_count: 0 };
}

export function getNextPositionFrom(progress:{ current_surah:number; current_ayat:number }) {
  return getNextPosition(progress.current_surah, progress.current_ayat);
}

export async function getTodaySessions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const today = formatISO(new Date(), { representation: 'date' });
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
  const { data: { user } } = await supabase.auth.getUser();
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

export async function createReadingSession(input: ReadingSessionInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  // Validate length
  const maxAyat = getAyatCount(input.surah_number);
  if (input.ayat_end > maxAyat) throw new Error('Ayat end exceeds surah length');

  const payload = {
    user_id: user.id,
    surah_number: input.surah_number,
    ayat_start: input.ayat_start,
    ayat_end: input.ayat_end,
    date: input.date ?? formatISO(new Date(), { representation: 'date' }),
    session_time: input.session_time ?? new Date().toISOString(),
    notes: input.notes ?? null,
  };

  // Insert session
  const { data: inserted, error } = await supabase
    .from('reading_sessions').insert(payload).select('*').single();
  if (error) throw error;

  const ayatCount = (inserted.ayat_end as number) - (inserted.ayat_start as number) + 1;

  // Fetch existing progress
  const progress = await getReadingProgress();

  // Forward-only progress update
  const isForward =
    (inserted.surah_number as number) > progress.current_surah ||
    ((inserted.surah_number as number) === progress.current_surah && (inserted.ayat_end as number) >= progress.current_ayat);

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

  // Cumulative check-in for today
  const today = formatISO(new Date(), { representation: 'date' });
  const todaySessions = await getTodaySessions();
  const todayTotal = todaySessions.reduce((sum: number, s: any) => sum + (s.ayat_count ?? 0), 0) + ayatCount;

  await supabase
    .from('checkins')
    .upsert({ user_id: user.id, date: today, ayat_count: todayTotal }, { onConflict: 'user_id,date' });

  return inserted;
}


