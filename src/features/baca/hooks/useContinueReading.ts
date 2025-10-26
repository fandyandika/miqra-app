import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loadSurahCombined } from '@/services/quran/quranData';

export function useContinueReading(userId?: string) {
  const [bookmark, setBookmark] = useState<{
    surahNumber: number;
    ayatNumber: number;
    surahName: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) loadBookmark();
  }, [userId]);

  async function loadBookmark() {
    if (!userId) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('last_read_surah, last_read_ayat')
        .eq('user_id', userId)
        .single();

      if (data?.last_read_surah) {
        const surah = await loadSurahCombined(data.last_read_surah);
        setBookmark({
          surahNumber: surah.number,
          surahName: surah.name,
          ayatNumber: data.last_read_ayat || 1,
        });
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    } finally {
      setLoading(false);
    }
  }

  return { bookmark, loading };
}
