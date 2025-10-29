import { supabase } from '@/lib/supabase';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { queryClient } from '@/lib/queryClient';

export interface Bookmark {
  id: string;
  user_id: string;
  surah_number: number;
  ayat_number: number;
  folder_name: string;
  notes?: string;
  juz?: number;
  created_at: string;
  updated_at: string;
}

export interface BookmarkFolder {
  name: string;
  count: number;
}

/**
 * Get all bookmarks for user
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favorite_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

/**
 * Get bookmarks grouped by folder
 */
export async function getBookmarksByFolder(): Promise<Record<string, Bookmark[]>> {
  const bookmarks = await getBookmarks();
  const grouped: Record<string, Bookmark[]> = {};

  bookmarks.forEach((bookmark) => {
    if (!grouped[bookmark.folder_name]) {
      grouped[bookmark.folder_name] = [];
    }
    grouped[bookmark.folder_name].push(bookmark);
  });

  return grouped;
}

/**
 * Get available folders
 */
export async function getBookmarkFolders(): Promise<BookmarkFolder[]> {
  const grouped = await getBookmarksByFolder();
  return Object.entries(grouped).map(([name, bookmarks]) => ({
    name,
    count: bookmarks.length,
  }));
}

/**
 * Add ayat to bookmarks
 */
export async function addBookmark(
  surahNumber: number,
  ayatNumber: number,
  folderName: string = 'Favorit',
  notes?: string,
  juz?: number
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('favorite_bookmarks').insert({
      user_id: user.id,
      surah_number: surahNumber,
      ayat_number: ayatNumber,
      folder_name: folderName,
      notes,
      juz,
    });

    if (error) throw error;

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Ayat Ditambahkan ke Bookmark ⭐', `Surah ${surahNumber} ayat ${ayatNumber}`);

    return true;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    showErrorToast('Gagal Menambah Bookmark', 'Coba lagi beberapa saat');
    return false;
  }
}

/**
 * Remove ayat from bookmarks
 */
export async function removeBookmark(surahNumber: number, ayatNumber: number): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('favorite_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('surah_number', surahNumber)
      .eq('ayat_number', ayatNumber);

    if (error) throw error;

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Ayat Dihapus dari Bookmark', `Surah ${surahNumber} ayat ${ayatNumber}`);

    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    showErrorToast('Gagal Menghapus Bookmark', 'Coba lagi beberapa saat');
    return false;
  }
}

/**
 * Check if ayat is bookmarked
 */
export async function isAyatBookmarked(surahNumber: number, ayatNumber: number): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorite_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('surah_number', surahNumber)
      .eq('ayat_number', ayatNumber)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

/**
 * Update bookmark folder or notes
 */
export async function updateBookmark(
  surahNumber: number,
  ayatNumber: number,
  updates: {
    folder_name?: string;
    notes?: string;
  }
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('favorite_bookmarks')
      .update(updates)
      .eq('user_id', user.id)
      .eq('surah_number', surahNumber)
      .eq('ayat_number', ayatNumber);

    if (error) throw error;

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Bookmark Diperbarui', 'Perubahan tersimpan');
    return true;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    showErrorToast('Gagal Memperbarui Bookmark', 'Coba lagi beberapa saat');
    return false;
  }
}

/**
 * Create a new folder and move bookmark to it
 */
export async function createFolderAndMoveBookmark(
  surahNumber: number,
  ayatNumber: number,
  folderName: string,
  notes?: string
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, check if bookmark exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('favorite_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('surah_number', surahNumber)
      .eq('ayat_number', ayatNumber)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingBookmark) {
      // Update existing bookmark
      const { error } = await supabase
        .from('favorite_bookmarks')
        .update({
          folder_name: folderName,
          notes,
        })
        .eq('id', existingBookmark.id);

      if (error) throw error;
    } else {
      // Create new bookmark
      const { error } = await supabase.from('favorite_bookmarks').insert({
        user_id: user.id,
        surah_number: surahNumber,
        ayat_number: ayatNumber,
        folder_name: folderName,
        notes,
      });

      if (error) throw error;
    }

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Folder Dibuat', `"${folderName}" berhasil dibuat`);
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    showErrorToast('Gagal Membuat Folder', 'Coba lagi beberapa saat');
    return false;
  }
}

/**
 * Create an empty folder (for UI purposes)
 */
export async function createEmptyFolder(folderName: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create a placeholder bookmark to establish the folder
    const { error } = await supabase.from('favorite_bookmarks').insert({
      user_id: user.id,
      surah_number: 1,
      ayat_number: 1,
      folder_name: folderName,
      notes: 'Folder kosong - hapus bookmark ini untuk menghapus folder',
    });

    if (error) throw error;

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Folder Dibuat', `"${folderName}" berhasil dibuat`);
    return true;
  } catch (error) {
    console.error('Error creating empty folder:', error);
    showErrorToast('Gagal Membuat Folder', 'Coba lagi beberapa saat');
    return false;
  }
}

/**
 * Rename all bookmarks in a folder
 */
export async function renameFolder(oldFolderName: string, newFolderName: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update all bookmarks in the old folder to the new folder name
    const { error } = await supabase
      .from('favorite_bookmarks')
      .update({ folder_name: newFolderName })
      .eq('user_id', user.id)
      .eq('folder_name', oldFolderName);

    if (error) throw error;

    // Invalidate queries to refresh bookmark lists
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks-by-folder'] });

    showSuccessToast('Folder Diubah', `"${oldFolderName}" → "${newFolderName}"`);
    return true;
  } catch (error) {
    console.error('Error renaming folder:', error);
    showErrorToast('Gagal Mengubah Folder', 'Coba lagi beberapa saat');
    return false;
  }
}
