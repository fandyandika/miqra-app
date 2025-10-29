import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export interface ReadingHistory {
  id: string;
  user_id: string;
  surah_number: number;
  ayat_number: number;
  juz?: number;
  page?: number;
  created_at: string;
}

/**
 * Get user's reading history
 */
export async function getReadingHistory(): Promise<ReadingHistory[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_settings')
      .select('last_read_surah, last_read_ayat, last_read_juz, last_read_page, last_read_at')
      .eq('user_id', user.id)
      .single();

    if (error || !data?.last_read_at) return [];

    // Return as history item
    return [
      {
        id: 'current',
        user_id: user.id,
        surah_number: data.last_read_surah || 1,
        ayat_number: data.last_read_ayat || 1,
        juz: data.last_read_juz,
        page: data.last_read_page,
        created_at: data.last_read_at,
      },
    ];
  } catch (error) {
    console.error('Error getting reading history:', error);
    return [];
  }
}

/**
 * Get detailed reading history from reading sessions
 */
export async function getDetailedReadingHistory(): Promise<ReadingHistory[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('reading_sessions')
      .select('id, surah_number, ayat_start, ayat_end, juz_number, page_number, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];

    return (
      data?.map((session) => ({
        id: session.id,
        user_id: user.id,
        surah_number: session.surah_number,
        ayat_number: session.ayat_start,
        juz: session.juz_number,
        page: session.page_number,
        created_at: session.created_at,
      })) || []
    );
  } catch (error) {
    console.error('Error getting detailed reading history:', error);
    return [];
  }
}
