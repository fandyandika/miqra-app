import { supabase } from '@/lib/supabase';

export type LastReadLog = {
  id: string;
  surah_number: number;
  ayat_number: number;
  juz_number?: number | null;
  page_number?: number | null;
  created_at: string;
};

export async function getLastReadHistory(limit = 100): Promise<LastReadLog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('last_read_history')
    .select('id, surah_number, ayat_number, juz_number, page_number, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as LastReadLog[];
}

export async function deleteLastReadHistory(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { error } = await supabase
    .from('last_read_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}
