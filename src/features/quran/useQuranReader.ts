import { useState, useEffect, useCallback } from 'react';
import { loadSurahCombined, type Surah } from '@/services/quran/quranData';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATION_TOGGLE_KEY = 'quran_show_translation';

export function useQuranReader(initialSurah = 1, lang = 'id') {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [selection, setSelection] = useState<{ start: number; end: number | null }>({
    start: 0,
    end: null,
  });
  const [showTranslation, setShowTranslation] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (number: number) => {
      setLoading(true);
      try {
        const data = await loadSurahCombined(number, lang);
        setSurah(data);
      } catch (e) {
        console.error('Failed to load surah:', e);
      } finally {
        setLoading(false);
      }
    },
    [lang]
  );

  // Load translation preference on mount
  useEffect(() => {
    loadTranslationPreference();
  }, []);

  useEffect(() => {
    load(initialSurah);
  }, [initialSurah, load]);

  async function loadTranslationPreference() {
    try {
      const saved = await AsyncStorage.getItem(TRANSLATION_TOGGLE_KEY);
      if (saved !== null) {
        setShowTranslation(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load translation preference:', error);
    }
  }

  function selectAyah(num: number) {
    if (!selection.start) {
      // First selection
      setSelection({ start: num, end: null });
    } else if (!selection.end) {
      // Complete the range selection
      const start = Math.min(selection.start, num);
      const end = Math.max(selection.start, num);
      setSelection({ start, end });
    } else {
      // Reset and start new selection
      setSelection({ start: num, end: null });
    }
  }

  function resetSelection() {
    setSelection({ start: 0, end: null });
  }

  async function toggleTranslation() {
    const newValue = !showTranslation;
    setShowTranslation(newValue);
    try {
      await AsyncStorage.setItem(TRANSLATION_TOGGLE_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save translation preference:', error);
    }
  }

  async function saveBookmark(userId: string, surahNum: number, ayahNum: number) {
    await supabase
      .from('user_settings')
      .update({
        last_read_surah: surahNum,
        last_read_ayat: ayahNum,
        last_read_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  return {
    surah,
    loading,
    currentAyah,
    setCurrentAyah,
    selection,
    selectAyah,
    resetSelection,
    showTranslation,
    setShowTranslation,
    toggleTranslation,
    saveBookmark,
    load,
  };
}
