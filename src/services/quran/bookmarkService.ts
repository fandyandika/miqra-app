import { supabase } from '@/lib/supabase';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export interface BookmarkPosition {
  surah: number;
  ayat: number;
  juz?: number;
  page?: number;
  surahName?: string;
  timestamp?: string;
}

/**
 * Save bookmark / last read position
 */
export async function saveBookmark(position: BookmarkPosition): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .update({
        last_read_surah: position.surah,
        last_read_ayat: position.ayat,
        last_read_juz: position.juz,
        last_read_page: position.page,
        last_read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return false;
  }
}

/**
 * Get user's last read position
 */
export async function getBookmark(): Promise<BookmarkPosition | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('last_read_surah, last_read_ayat, last_read_juz, last_read_page, last_read_at')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    // If never read before (defaults)
    if (!data.last_read_at) return null;

    return {
      surah: data.last_read_surah || 1,
      ayat: data.last_read_ayat || 1,
      juz: data.last_read_juz,
      page: data.last_read_page,
      timestamp: data.last_read_at,
    };
  } catch (error) {
    console.error('Error getting bookmark:', error);
    return null;
  }
}

/**
 * Mark specific ayat as last read (from long-press menu)
 */
export async function markAsLastRead(
  surahNumber: number,
  ayatNumber: number,
  surahName: string,
  juzNumber?: number,
  pageNumber?: number
): Promise<boolean> {
  const success = await saveBookmark({
    surah: surahNumber,
    ayat: ayatNumber,
    juz: juzNumber,
    page: pageNumber,
  });

  if (success) {
    // Log to last_read_history (best-effort)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from('last_read_history').insert({
          user_id: user.id,
          surah_number: surahNumber,
          ayat_number: ayatNumber,
          juz_number: juzNumber ?? null,
          page_number: pageNumber ?? null,
        });
      }
    } catch {}
    showSuccessToast('Posisi Tersimpan 📍', `${surahName} ayat ${ayatNumber}`);
  } else {
    showErrorToast('Gagal Menyimpan', 'Coba lagi beberapa saat');
  }

  return success;
}

/**
 * Auto-save bookmark when user reads (silent, no toast)
 */
export async function autoSaveBookmark(position: BookmarkPosition): Promise<void> {
  await saveBookmark(position);
  // Silent save - no toast notification
}
