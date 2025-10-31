import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  AccessibilityInfo,
} from 'react-native';
import { Dimensions } from 'react-native';
import QuranPager from './components/QuranPager';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { useQuranReader } from './useQuranReader';
import { colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createReadingSession, ReadingSessionInput } from '@/services/reading';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import BasmalahHeader from '@/features/quran/components/BasmalahHeader';
import JumpToSurahModal from '@/features/quran/components/JumpToSurahModal';
import { loadJuzContent, getJuzTitle, AyahWithSurahInfo } from '@/services/quran/juzUtils';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/utils/toast';
import { getPageForAyah, getJuzForAyah, getJuzStartAyah } from '@/services/quran/pageMap';
import { calculateSelectionHasanat } from '@/services/hasanatUtils';
import QuranSurahHeader from './components/QuranSurahHeader';
import { markAsLastRead } from '@/services/quran/bookmarkService';
import LogoAyat1 from '../../../assets/nomorayat/logoayat1.svg';
import {
  addBookmark,
  isAyatBookmarked,
  getBookmarkFolders,
  createEmptyFolder,
} from '@/services/quran/favoriteBookmarks';
import {
  loadSurahTranslation,
  loadSurahMetadata,
  loadSurahCombined,
  type Ayah,
  type SurahMetadata,
} from '@/services/quran/quranData';
import {
  buildLayoutExact,
  canMeasureText,
  type Item as LayoutItem,
} from '@/features/quran/layout/measureAyatLayout';
import SettingsModal from './components/SettingsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReaderScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { surahNumber: pSurah, ayatNumber: pAyat, juzNumber } = route.params || {};
  const [surahNumber, setSurahNumber] = useState<number>(pSurah || 1);
  const [bookmarkAyat, setBookmarkAyat] = useState<number | null>(pAyat ?? null);
  const listRef = useRef<FlashList<any>>(null);
  const [visibleAyat, setVisibleAyat] = useState<number>(1);
  const [highlightedAyat, setHighlightedAyat] = useState<number | null>(null);
  const [visiblePage, setVisiblePage] = useState<number | null>(null);
  const [pressedAyah, setPressedAyah] = useState<number | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [checkedAyat, setCheckedAyat] = useState<Set<number>>(new Set());
  const [visibleSurahInfo, setVisibleSurahInfo] = useState<{
    surahNumber: number;
    surahName: string;
  } | null>(null);
  const [, setSelectedHasanat] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [translation, setTranslation] = useState<{ ayat: Ayah[] } | null>(null);
  const [surahMeaning, setSurahMeaning] = useState<string | undefined>(undefined);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [surahList, setSurahList] = useState<SurahMetadata[]>([]);
  const [pendingAyat, setPendingAyat] = useState<number | null>(null);

  // Settings state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(false);

  // Juz mode state
  const [isJuzMode] = useState(!!juzNumber);
  const [juzAyat, setJuzAyat] = useState<AyahWithSurahInfo[]>([]);
  const [juzTitle, setJuzTitle] = useState<string>('');
  const [juzLoading, setJuzLoading] = useState(false);
  const [juzPrevStart, setJuzPrevStart] = useState<{ surah: number; ayah: number } | null>(null);
  const [juzNextStart, setJuzNextStart] = useState<{ surah: number; ayah: number } | null>(null);
  const juzPrevCacheRef = useRef<AyahWithSurahInfo[] | null>(null);
  const juzNextCacheRef = useRef<AyahWithSurahInfo[] | null>(null);
  const [headerH, setHeaderH] = useState(0);
  const startKeyRef = useRef<string | null>(null);
  const reattemptScrollRef = useRef<boolean>(true);
  const [layout, setLayout] = useState<{
    lengths: number[];
    offsets: number[];
    indexMap: Record<string, number>;
  } | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const initialBookmarkAppliedRef = useRef<boolean>(false);

  // Helpers for header navigation (prev/current/next)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const getSurahNameByNum = (n: number) =>
    surahList.find((m) => m.number === n)?.name || `Surah ${n}`;
  const getPrevNext = () => {
    if (!isJuzMode) {
      const prev = clamp(surahNumber - 1, 1, 114);
      const next = clamp(surahNumber + 1, 1, 114);
      return { prev, curr: surahNumber, next };
    } else {
      const currJ = (juzNumber as number) || 1;
      const prev = clamp(currJ - 1, 1, 30);
      const next = clamp(currJ + 1, 1, 30);
      return { prev, curr: currJ, next };
    }
  };
  const handlePrev = () => {
    // Quran UX: "sebelum" (previous numerically) on the RIGHT
    const { prev } = getPrevNext();
    if (!isJuzMode) {
      if (prev !== surahNumber) navigation.setParams({ surahNumber: prev });
    } else {
      if (prev !== juzNumber) navigation.push('Reader', { juzNumber: prev, surahNumber });
    }
  };
  const handleNext = () => {
    // Quran UX: "sesudah" (next numerically) on the LEFT
    const { next } = getPrevNext();
    if (!isJuzMode) {
      if (next !== surahNumber) navigation.setParams({ surahNumber: next });
    } else {
      if (next !== juzNumber) navigation.push('Reader', { juzNumber: next, surahNumber });
    }
  };

  // Handlers for QuranPager swipe changes - update state immediately for smooth UX
  const handleSurahChange = (newSurah: number) => {
    if (newSurah !== surahNumber) {
      setSurahNumber(newSurah);
      navigation.setParams({ surahNumber: newSurah });
    }
  };

  const handleJuzChange = (newJuz: number) => {
    if (newJuz !== juzNumber) {
      // For Juz, we need to reload, so navigation replace is fine
      navigation.replace('Reader', { juzNumber: newJuz, surahNumber });
    }
  };

  // Surah-mode header meta
  const headerJuz = useMemo(() => {
    if (isJuzMode) return null;
    try {
      const j = getJuzForAyah(surahNumber, 1);
      return typeof j === 'number' ? j : null;
    } catch {
      return null;
    }
  }, [isJuzMode, surahNumber]);

  const getArabicNumber = (num: number): string => {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num
      .toString()
      .split('')
      .map((digit) => arabic[parseInt(digit)])
      .join('');
  };

  // Load available folders
  const loadFolders = async () => {
    try {
      const folders = await getBookmarkFolders();
      const folderNames = folders.map((f) => f.name);
      setAvailableFolders(folderNames);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  // Handle bookmark selection
  const handleBookmarkSelection = (folderName: string) => {
    if (pressedAyah && surah) {
      const currentSurah =
        isJuzMode && visibleSurahInfo ? visibleSurahInfo.surahNumber : surahNumber;
      const currentJuz = isJuzMode ? juzNumber : getJuzForAyah(currentSurah, pressedAyah);

      addBookmark(currentSurah, pressedAyah, folderName, undefined, currentJuz);
      setPressedAyah(null);
      setShowFolderModal(false);
    }
  };

  // Handle create new folder
  const handleCreateNewFolder = () => {
    setShowCreateFolderModal(true);
    setNewFolderName('');
  };

  // Handle create folder with input
  const handleCreateFolderSubmit = async () => {
    if (newFolderName.trim()) {
      const success = await createEmptyFolder(newFolderName.trim());
      if (success) {
        loadFolders();
        setShowCreateFolderModal(false);
        setNewFolderName('');
      }
    }
  };

  const { surah, loading, selection, resetSelection, showTranslation, setShowTranslation } =
    useQuranReader(surahNumber, 'id');

  // Calculate hasanat for current selection (supports both tap selection and checkbox selection)
  useEffect(() => {
    console.log('[ReaderScreen] Selection state:', selection);
    console.log('[ReaderScreen] Checked ayat:', Array.from(checkedAyat));

    if (isSelectingRange && checkedAyat.size > 0) {
      // Use checkbox selection
      const sortedAyat = Array.from(checkedAyat).sort((a, b) => a - b);
      const rangeStart = sortedAyat[0];
      const rangeEnd = sortedAyat[sortedAyat.length - 1];

      console.log('[ReaderScreen] Using checkbox selection:', {
        surah: surahNumber,
        start: rangeStart,
        end: rangeEnd,
        checkedCount: checkedAyat.size,
      });

      calculateSelectionHasanat(surahNumber, rangeStart, rangeEnd)
        .then((data) => {
          console.log('[ReaderScreen] Hasanat calculated (checkbox):', data);
          setSelectedHasanat(data.totalHasanat);
        })
        .catch((error) => {
          console.error('[ReaderScreen] Error calculating hasanat (checkbox):', error);
          setSelectedHasanat(0);
        });
    } else if (selection.start && surah) {
      // Use tap selection
      const rangeStart = selection.start;
      const rangeEnd = selection.end ?? selection.start;
      console.log('[ReaderScreen] Using tap selection:', {
        surah: surah.number,
        start: rangeStart,
        end: rangeEnd,
        selectionState: selection,
      });
      calculateSelectionHasanat(surah.number, rangeStart, rangeEnd)
        .then((data) => {
          console.log('[ReaderScreen] Hasanat calculated (tap):', data);
          setSelectedHasanat(data.totalHasanat);
        })
        .catch((error) => {
          console.error('[ReaderScreen] Error calculating hasanat (tap):', error);
          setSelectedHasanat(0);
        });
    } else {
      setSelectedHasanat(0);
    }
  }, [selection, surah, checkedAyat, isSelectingRange, surahNumber]);

  // Check bookmark status when pressedAyah changes
  useEffect(() => {
    if (pressedAyah && surah) {
      const currentSurah =
        isJuzMode && visibleSurahInfo ? visibleSurahInfo.surahNumber : surahNumber;

      isAyatBookmarked(currentSurah, pressedAyah)
        .then(setIsBookmarked)
        .catch(() => setIsBookmarked(false));
    }
  }, [pressedAyah, surah, surahNumber, isJuzMode, visibleSurahInfo]);

  // Load bookmark if no params provided
  useEffect(() => {
    (async () => {
      if (pSurah) return;
      if (!user?.id) return;

      const { data } = await supabase
        .from('user_settings')
        .select('last_read_surah, last_read_ayat')
        .eq('user_id', user.id)
        .single();

      if (data?.last_read_surah) {
        setSurahNumber(data.last_read_surah);
        setBookmarkAyat(data.last_read_ayat || 1);
      }
    })();
  }, [pSurah, user?.id]);

  // Sync local state with route params for cross-surah jumps
  useEffect(() => {
    const params: any = route?.params || {};
    if (typeof params.surahNumber === 'number' && params.surahNumber !== surahNumber) {
      setSurahNumber(params.surahNumber);
    }
    if (typeof params.ayatNumber === 'number') {
      setBookmarkAyat(params.ayatNumber);
      setPendingAyat(params.ayatNumber);
    }
  }, [route?.params]);

  // Load translation and metadata when surah changes
  useEffect(() => {
    (async () => {
      if (surahNumber && !isJuzMode) {
        try {
          const [translationData, metadataList] = await Promise.all([
            loadSurahTranslation(surahNumber, 'id'),
            loadSurahMetadata(),
          ]);
          setTranslation(translationData);
          const surahMeta = metadataList.find((m) => m.number === surahNumber);
          setSurahMeaning(surahMeta?.name_translation || undefined);
          // Initialize accurate page/ayat for Surah mode
          const firstPage = getPageForAyah(surahNumber, 1);
          setVisiblePage(typeof firstPage === 'number' ? firstPage : null);
          setVisibleAyat(1);
        } catch (error) {
          console.error('Error loading translation or metadata:', error);
        }
      }
    })();
  }, [surahNumber, isJuzMode]);

  // Prefetch adjacent Surah content and warm layout cache for smoother swipe
  useEffect(() => {
    if (isJuzMode) return;
    const { prev, next } = getPrevNext();
    (async () => {
      try {
        const [prevSurah, nextSurah] = await Promise.all([
          loadSurahCombined(prev).catch(() => null),
          loadSurahCombined(next).catch(() => null),
        ]);
        if (canMeasureText()) {
          const screenW = Dimensions.get('window').width;
          const contentWidth = Math.max(50, screenW - 7 * 2 - 18 * 2);
          const common = {
            isJuzMode: false,
            showTranslation: !!showTranslation,
            width: contentWidth,
            headerHeight: headerH,
            arabic: {
              fontFamily: 'LPMQ-Isep-Misbah',
              fontSize: 25,
              lineHeight: 56,
              allowFontScaling: false,
            },
            trans: { fontFamily: 'System', fontSize: 16, lineHeight: 24, allowFontScaling: false },
            row: { padV: 10, padH: 7, borderBottom: 1 },
          } as any;
          if (prevSurah?.ayat?.length) {
            buildLayoutExact(prevSurah.ayat as unknown as LayoutItem[], {
              ...common,
              surahNumber: prev,
              cacheKey: `surah-${prev}-${!!showTranslation}`,
            }).catch(() => {});
          }
          if (nextSurah?.ayat?.length) {
            buildLayoutExact(nextSurah.ayat as unknown as LayoutItem[], {
              ...common,
              surahNumber: next,
              cacheKey: `surah-${next}-${!!showTranslation}`,
            }).catch(() => {});
          }
        }
      } catch {}
    })();
  }, [isJuzMode, surahNumber, showTranslation, headerH]);

  // Load folders when component mounts
  useEffect(() => {
    loadFolders();
  }, []);

  // Load settings preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const [darkMode, transliteration] = await Promise.all([
          AsyncStorage.getItem('quran_dark_mode'),
          AsyncStorage.getItem('quran_show_transliteration'),
        ]);
        if (darkMode !== null) {
          const val = JSON.parse(darkMode);
          setIsDarkMode(val);
        }
        if (transliteration !== null) {
          const val = JSON.parse(transliteration);
          setShowTransliteration(val);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    })();
  }, []);

  // Load surah metadata for jump modal
  useEffect(() => {
    (async () => {
      try {
        const meta = await loadSurahMetadata();
        setSurahList(meta);
      } catch (e) {
        console.error('Failed to load surah metadata:', e);
      }
    })();
  }, []);

  // Load Juz content if in Juz mode
  useEffect(() => {
    if (juzNumber && isJuzMode) {
      setJuzLoading(true);
      Promise.all([loadJuzContent(juzNumber), getJuzTitle(juzNumber)])
        .then(([ayat, title]) => {
          setJuzAyat(ayat);
          setJuzTitle(title);
          // Reset bookmark auto-scroll context in Juz mode to avoid jumping to another surah
          setBookmarkAyat(null);
          // Initialize start key for enforcing first item visibility (e.g., 1:1)
          if (Array.isArray(ayat) && ayat.length > 0) {
            const first = ayat[0];
            startKeyRef.current = `${first.surahNumber}:${first.number}`;
            reattemptScrollRef.current = true;
          } else {
            startKeyRef.current = null;
          }
          // Prefetch Juz start labels for previews
          try {
            const { prev, next } = getPrevNext();
            setJuzPrevStart(getJuzStartAyah(prev));
            setJuzNextStart(getJuzStartAyah(next));
            // Prefetch adjacent Juz content into memory cache for instant swipe
            loadJuzContent(prev)
              .then((data) => (juzPrevCacheRef.current = data))
              .catch(() => {});
            loadJuzContent(next)
              .then((data) => (juzNextCacheRef.current = data))
              .catch(() => {});
          } catch {}
          setJuzLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Juz:', err);
          setJuzLoading(false);
        });
    }
  }, [juzNumber, isJuzMode]);

  // Prefetch adjacent Juz content to smooth swipe transitions in Juz mode
  useEffect(() => {
    if (!isJuzMode || !juzNumber) return;
    const { prev, next } = getPrevNext();
    loadJuzContent(prev).catch(() => {});
    loadJuzContent(next).catch(() => {});
  }, [isJuzMode, juzNumber]);

  // Reset scroll when surah/juz changes via swipe (but not on initial load with explicit target)
  useEffect(() => {
    if (!listRef.current) return;
    const params: any = route?.params || {};
    const hasExplicitTarget =
      typeof params.ayatNumber === 'number' || typeof params.ayat === 'number';

    if (hasExplicitTarget) return; // Don't reset if there's an explicit target

    // Reset scroll to top when surah/juz changes
    const raf = requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, [surahNumber, juzNumber, isJuzMode]);

  // Ensure Juz starts at its true boundary (e.g., Juz 1 from Al-Fatihah) and subtitle reflects it immediately
  useEffect(() => {
    if (!isJuzMode || juzAyat.length === 0) return;
    const params: any = route?.params || {};
    const hasExplicitTarget =
      typeof params.ayatNumber === 'number' || typeof params.ayat === 'number';
    const first = juzAyat[0];
    if (first) {
      if (first.surahNumber && first.surahName) {
        setVisibleSurahInfo({ surahNumber: first.surahNumber, surahName: first.surahName });
      }
      setVisiblePage(typeof first.page === 'number' ? first.page : null);
      setVisibleAyat(typeof first.number === 'number' ? first.number : 1);
    }
    if (!hasExplicitTarget) {
      const raf = requestAnimationFrame(() => {
        try {
          listRef.current?.scrollToIndex({ index: 0, animated: false, viewPosition: 0 });
        } catch {}
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isJuzMode, juzAyat, route?.params?.juzNumber]);

  // Scroll after navigation when ayatNumber provided
  useEffect(() => {
    const params: any = route?.params || {};
    const targetAyat: number | undefined = params?.ayatNumber || params?.ayat;
    if (targetAyat && ((isJuzMode ? juzAyat.length : surah?.ayat?.length) || 0) > 0) {
      setTimeout(() => {
        scrollToAyat(targetAyat, params?.surahNumber);
      }, 500);
    }
  }, [route?.params, surah?.ayat?.length, juzAyat.length, isJuzMode]);

  // Auto-scroll after load (pending ayat or bookmark)
  useEffect(() => {
    if (
      pendingAyat &&
      listRef.current &&
      ((isJuzMode ? juzAyat.length : surah?.ayat?.length) || 0) > 0
    ) {
      const target = pendingAyat;
      setTimeout(() => {
        try {
          scrollToAyat(target);
        } catch {}
      }, 400);
      setPendingAyat(null);
      return;
    }
    // Apply bookmark scroll only once on initial mount (Surah mode), not on every Surah change
    if (
      bookmarkAyat &&
      listRef.current &&
      surah?.ayat &&
      !isJuzMode &&
      !initialBookmarkAppliedRef.current
    ) {
      setTimeout(() => {
        try {
          scrollToAyat(bookmarkAyat);
        } catch {}
      }, 300);
      initialBookmarkAppliedRef.current = true;
    } else if (isJuzMode) {
      // In Juz mode, avoid auto-scrolling to bookmarkAyat to prevent jumping to wrong surah
      // Let initial focus logic keep us at the Juz start unless an explicit target is set
    }
  }, [pendingAyat, bookmarkAyat, surahNumber, surah?.ayat, juzAyat, isJuzMode]);

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: AyahWithSurahInfo }[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const firstItem = viewableItems[0]?.item as AyahWithSurahInfo | undefined;
        const first = firstItem?.number;
        if (typeof first === 'number') setVisibleAyat(first);
        if (isJuzMode) {
          // Enforce Juz start visibility once if initial item not matching boundary
          const key =
            firstItem && firstItem.surahNumber
              ? `${firstItem.surahNumber}:${firstItem.number}`
              : null;
          if (
            reattemptScrollRef.current &&
            startKeyRef.current &&
            key &&
            key !== startKeyRef.current
          ) {
            try {
              listRef.current?.scrollToIndex({ index: 0, animated: false, viewPosition: 0 });
            } catch {}
            reattemptScrollRef.current = false;
            return;
          }
          if (key && startKeyRef.current && key === startKeyRef.current) {
            reattemptScrollRef.current = false;
          }
          setVisiblePage(typeof firstItem?.page === 'number' ? firstItem.page : null);
          if (firstItem?.surahNumber && firstItem?.surahName) {
            setVisibleSurahInfo({
              surahNumber: firstItem.surahNumber,
              surahName: firstItem.surahName,
            });
          }
        } else {
          // Surah mode: derive page and surah info
          const p = getPageForAyah(surahNumber, typeof first === 'number' ? first : 1);
          setVisiblePage(typeof p === 'number' ? p : null);
          if (surah?.name) {
            setVisibleSurahInfo({ surahNumber, surahName: surah.name });
          }
        }
      }
    }
  );

  const scrollToAyat = (ayatNumber: number, targetSurahNumber?: number) => {
    if (!listRef.current) return;
    const list = (isJuzMode ? juzAyat : surah?.ayat) || [];
    const sNum = isJuzMode
      ? (targetSurahNumber ?? visibleSurahInfo?.surahNumber ?? surahNumber)
      : surahNumber;
    let idx: number | undefined = undefined;
    if (layout?.indexMap) {
      const mapped = layout.indexMap[`${sNum}:${ayatNumber}`];
      if (typeof mapped === 'number') idx = mapped;
    }
    if (idx === undefined) {
      const found = list.findIndex((a: any) =>
        isJuzMode ? a.surahNumber === sNum && a.number === ayatNumber : a.number === ayatNumber
      );
      if (found >= 0) idx = found;
    }
    if (typeof idx !== 'number' || idx < 0) return;
    try {
      listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 });
    } catch {}
    setHighlightedAyat(ayatNumber);
    setTimeout(() => setHighlightedAyat(null), 3000);
  };

  const handleJump = (surah: number, ayat: number) => {
    const meta = surahList.find((s) => s.number === surah);
    if (isJuzMode) {
      const targetJuz = getJuzForAyah(surah, ayat) || 1;
      navigation.push('Reader', {
        juzNumber: targetJuz,
        surahNumber: surah,
        ayatNumber: ayat,
      });
      showInfoToast(`Membuka ${meta?.name || 'Surah'}`, `Ayat ${ayat} • Juz ${targetJuz}`);
      return;
    }
    if (surah !== surahNumber) {
      navigation.setParams({ surahNumber: surah, ayatNumber: ayat });
      showInfoToast(`Membuka ${meta?.name || 'Surah'}`, `Ayat ${ayat}`);
    } else {
      scrollToAyat(ayat);
      showInfoToast('Melompat ke ayat', `${meta?.name || 'Surah'} ayat ${ayat}`);
    }
  };

  const logMutation = useMutation({
    mutationFn: (input: ReadingSessionInput) => {
      console.log('[ReaderScreen] Creating reading session with input:', input);
      return createReadingSession(input);
    },
    onSuccess: (data) => {
      console.log('[ReaderScreen] Reading session created successfully:', data);
      const ayatCount = (data.ayat_end as number) - (data.ayat_start as number) + 1;
      const hasanat = data.hasanat_earned || 0;
      console.log('[ReaderScreen] Showing toast with:', { ayatCount, hasanat });
      showSuccessToast(
        'Bacaan Tersimpan! 🎉',
        `${ayatCount} ayat • ${Number(hasanat).toLocaleString('id-ID')} hasanat`
      );

      // Reset all selection states
      resetSelection();
      setIsSelectingRange(false);
      setCheckedAyat(new Set());
      setSelectedHasanat(0);
    },
    onError: (error) => {
      console.error('[ReaderScreen] Save error:', error);
      showErrorToast('Gagal Menyimpan', 'Coba lagi beberapa saat');
    },
  });

  const handleLog = async () => {
    if (!surah) return;

    let ayatStart: number;
    let ayatEnd: number;

    if (isSelectingRange && checkedAyat.size > 0) {
      // Use checkbox selection
      const sortedAyat = Array.from(checkedAyat).sort((a, b) => a - b);
      ayatStart = sortedAyat[0];
      ayatEnd = sortedAyat[sortedAyat.length - 1];

      console.log('[ReaderScreen] handleLog using checkbox selection:', {
        surah: surah.number,
        start: ayatStart,
        end: ayatEnd,
        checkedCount: checkedAyat.size,
      });
    } else if (selection.start) {
      // Use tap selection
      ayatStart = selection.start;
      ayatEnd = selection.end ?? selection.start;

      console.log('[ReaderScreen] handleLog using tap selection:', {
        surah: surah.number,
        start: ayatStart,
        end: ayatEnd,
        selectionState: selection,
      });
    } else {
      console.log('[ReaderScreen] handleLog: No selection available');
      return;
    }

    logMutation.mutate({
      surah_number: surah.number,
      ayat_start: ayatStart,
      ayat_end: ayatEnd,
    });
  };

  const handleAyahPress = (number: number) => {
    if (isSelectingRange) {
      setCheckedAyat((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(number)) {
          // If clicking on already selected ayat, remove it
          console.log('[ReaderScreen] Removing ayat:', number);
          newSet.delete(number);
        } else if (newSet.size === 0) {
          // First selection - just add the ayat
          console.log('[ReaderScreen] First selection:', number);
          newSet.add(number);
        } else {
          // Auto-range selection: select all ayat between first and current
          const sortedAyat = Array.from(newSet).sort((a, b) => a - b);
          const firstAyat = sortedAyat[0];
          const lastAyat = sortedAyat[sortedAyat.length - 1];

          // Determine range
          const startAyat = Math.min(firstAyat, number);
          const endAyat = Math.max(lastAyat, number);

          console.log('[ReaderScreen] Auto-range selection:', {
            clicked: number,
            existing: Array.from(newSet),
            range: `${startAyat}-${endAyat}`,
            totalAyat: endAyat - startAyat + 1,
          });

          // Add all ayat in the range
          for (let ayah = startAyat; ayah <= endAyat; ayah++) {
            newSet.add(ayah);
          }
        }

        console.log('[ReaderScreen] New selection:', Array.from(newSet));
        return newSet;
      });
    } else {
      setPressedAyah(number);
    }
  };

  // Determine which data to use
  const displayAyat = isJuzMode ? juzAyat : surah?.ayat || [];
  const displayTitle = isJuzMode ? juzTitle : surah?.name || '';

  // NOTE: Do not early-return before all hooks above are declared

  const totalAyat = displayAyat.length;
  // Current page: use visible item state; Surah/Juz subtitle will recompute directly when needed
  const currentPage = visiblePage;
  const progress = totalAyat ? Math.max(0, Math.min(100, (visibleAyat / totalAyat) * 100)) : 0;

  // Build header subtitle
  const getSubtitle = () => {
    if (isJuzMode) {
      const sNum = visibleSurahInfo?.surahNumber || surahNumber;
      const aNum = visibleAyat || 1;
      const p = getPageForAyah(sNum, aNum);
      const sName = visibleSurahInfo?.surahName;
      if (sName && sNum) {
        return `${sNum}. ${sName} | Hlm. ${typeof p === 'number' ? p : '-'}`;
      }
      return `Hlm. ${typeof p === 'number' ? p : '-'}`;
    }
    const sNum = surahNumber;
    const aNum = visibleAyat || 1;
    const j = getJuzForAyah(sNum, aNum);
    const p = getPageForAyah(sNum, aNum);
    return `Juz ${j ?? '-'} | Hlm. ${typeof p === 'number' ? p : '-'}`;
  };

  // Announce subtitle changes for screen readers (Surah & Juz mode)
  useEffect(() => {
    const subtitleText = getSubtitle();
    if (subtitleText && typeof subtitleText === 'string') {
      try {
        AccessibilityInfo.announceForAccessibility(subtitleText);
      } catch {}
    }
    // Depend on values affecting subtitle content
  }, [
    isJuzMode,
    visibleSurahInfo?.surahName,
    visibleSurahInfo?.surahNumber,
    surahNumber,
    visibleAyat,
  ]);
  const selectedCount = isSelectingRange
    ? checkedAyat.size
    : selection.start
      ? (selection.end ? selection.end : selection.start) - selection.start + 1
      : 0;

  console.log('[ReaderScreen] Selected count calculation:', {
    selection,
    checkedAyat: Array.from(checkedAyat),
    isSelectingRange,
    selectedCount,
    hasEnd: !!selection.end,
  });

  // Header component measured for accurate layout
  const HeaderComp = useMemo(
    () =>
      !isJuzMode ? (
        <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
          <QuranSurahHeader
            revelation={surahNumber && surahNumber <= 7 ? 'Mekah' : 'Madinah'}
            surahNumber={surahNumber}
            surahName={surah?.name || ''}
            meaning={surahMeaning}
            totalAyahs={surah?.ayat?.length}
            surahNameAr={undefined}
          />
          {surahNumber !== 1 && surahNumber !== 9 ? <BasmalahHeader /> : null}
        </View>
      ) : null,
    [isJuzMode, surahNumber, surah?.name, surahMeaning, surah?.ayat?.length]
  );

  // Build exact layout when data ready
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items = displayAyat as unknown as LayoutItem[];
      if (!items || items.length === 0) return;
      setLayoutReady(false);
      try {
        if (!canMeasureText()) {
          // Native text-measure not available yet (e.g., running in Expo Go). Skip until dev build is used.
          return;
        }
        const screenW = Dimensions.get('window').width;
        const contentWidth = Math.max(50, screenW - 7 * 2 - 18 * 2);
        const cacheKey = `${isJuzMode ? `juz-${juzNumber}` : `surah-${surahNumber}`}-${!!showTranslation}`;
        const res = await buildLayoutExact(items, {
          isJuzMode,
          surahNumber,
          showTranslation: !!showTranslation,
          width: contentWidth,
          headerHeight: headerH,
          arabic: {
            fontFamily: 'LPMQ-Isep-Misbah',
            fontSize: 25,
            lineHeight: 56,
            allowFontScaling: false,
          },
          trans: { fontFamily: 'System', fontSize: 16, lineHeight: 24, allowFontScaling: false },
          row: { padV: 10, padH: 7, borderBottom: 1 },
          cacheKey,
        } as any);
        if (cancelled) return;
        setLayout(res);
        setLayoutReady(true);
      } catch (e) {
        console.error('buildLayoutExact failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayAyat, isJuzMode, surahNumber, showTranslation, headerH]);

  // Loading guard (after hooks)
  if (
    (loading && !isJuzMode) ||
    juzLoading ||
    (!surah && !isJuzMode) ||
    (isJuzMode && juzAyat.length === 0)
  ) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const atFirst = !isJuzMode ? surahNumber === 1 : ((juzNumber as number) || 1) === 1;
  const atLast = !isJuzMode ? surahNumber === 114 : ((juzNumber as number) || 1) === 30;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={[styles.topBar, isDarkMode && styles.topBarDark]}>
        {/* Back Button - Left */}
        <Pressable
          onPress={() => {
            try {
              navigation.replace('SurahSelector');
            } catch {
              if (navigation.canGoBack()) navigation.goBack();
            }
          }}
          style={[styles.headerIconButton, { marginLeft: -8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
        </Pressable>

        {/* Title & Subtitle - Absolute Center */}
        <View style={styles.headerCenterAbsolute}>
          <Text
            style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
            numberOfLines={1}
          >
            {isJuzMode ? `Juz ${getPrevNext().curr}` : `${getSurahNameByNum(getPrevNext().curr)}`}
          </Text>
          <Text
            style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}
            accessibilityRole="text"
            accessible={true}
            accessibilityLabel={getSubtitle()}
            numberOfLines={1}
          >
            {getSubtitle()}
          </Text>
        </View>

        {/* Action Buttons - Right */}
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerIconButton, { marginRight: -4 }]}
            onPress={() => setShowJumpModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="search" size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
          </Pressable>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => setShowSettingsModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="more-vertical" size={24} color={isDarkMode ? '#F3F4F6' : '#111827'} />
          </Pressable>
        </View>
      </View>

      {/* Prev/Next Navigation Bar - Below Header */}
      <View style={[styles.headerNavBar, isDarkMode && styles.headerNavBarDark]}>
        <View style={styles.headerNavContent}>
          <View style={styles.headerNavLeft}>
            {!atLast && (
              <Pressable onPress={handleNext} style={styles.headerNavButton} hitSlop={8}>
                <Text
                  style={[styles.headerNavText, isDarkMode && styles.headerNavTextDark]}
                  numberOfLines={1}
                >
                  {isJuzMode
                    ? `Juz ${getPrevNext().next}`
                    : `${getPrevNext().next}. ${getSurahNameByNum(getPrevNext().next)}`}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.headerNavRight}>
            {!atFirst && (
              <Pressable onPress={handlePrev} style={styles.headerNavButton} hitSlop={8}>
                <Text
                  style={[styles.headerNavText, isDarkMode && styles.headerNavTextDark]}
                  numberOfLines={1}
                >
                  {isJuzMode
                    ? `Juz ${getPrevNext().prev}`
                    : `${getPrevNext().prev}. ${getSurahNameByNum(getPrevNext().prev)}`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      {/* Swipeable pager with peek */}
      <QuranPager
        initialSurah={surahNumber}
        initialJuz={juzNumber as number | undefined}
        isJuzMode={isJuzMode}
        onSurahChange={handleSurahChange}
        onJuzChange={handleJuzChange}
        renderPage={(pagerSurah, pagerJuz) => {
          // Pager passes the active surah/juz during swipe
          // We use the current loaded data (displayAyat) which will update
          // when handleSurahChange/handleJuzChange triggers state update
          // The key improvement: swipe is batched and smoother, plus immediate state sync
          return (
            <FlashList
              ref={listRef}
              data={displayAyat}
              keyExtractor={(item, index) => `${item.number}_${index}`}
              estimatedItemSize={240}
              getItemType={() => 'ayah'}
              {...(layout
                ? {
                    getItemLayout: (_: any, index: number) => ({
                      length: layout.lengths[index] ?? 0,
                      offset: layout.offsets[index] ?? 0,
                      index,
                    }),
                    ListHeaderComponent: HeaderComp,
                  }
                : { ListHeaderComponent: HeaderComp })}
              contentContainerStyle={{
                paddingBottom: isSelectingRange || selectedCount > 0 ? 120 : 20,
              }}
              renderItem={({ item, index }) => {
                const ayahItem = item as AyahWithSurahInfo;
                const shouldShowSurahHeader =
                  isJuzMode && ayahItem.isSurahStart && ayahItem.surahNumber && ayahItem.surahName;

                return (
                  <>
                    {shouldShowSurahHeader && (
                      <>
                        <QuranSurahHeader
                          revelation={
                            ayahItem.surahNumber && ayahItem.surahNumber <= 7 ? 'Mekah' : 'Madinah'
                          }
                          surahNumber={ayahItem.surahNumber || 1}
                          surahName={ayahItem.surahName || ''}
                          meaning={ayahItem.surahMeaning}
                          totalAyahs={ayahItem.surahTotalAyahs}
                          surahNameAr={ayahItem.surahNameAr}
                        />
                        {/* Basmalah only for first ayah of surah, except for Al-Fatihah (1) and At-Taubah (9) */}
                        {ayahItem.isFirstAyahOfSurah &&
                          ayahItem.surahNumber !== 1 &&
                          ayahItem.surahNumber !== 9 && <BasmalahHeader />}
                      </>
                    )}
                    <Pressable
                      onPress={() => handleAyahPress(ayahItem.number)}
                      style={[
                        styles.ayahContainer,
                        index % 2 === 0 ? styles.ayahEven : styles.ayahOdd,
                        isDarkMode && index % 2 === 0 && styles.ayahEvenDark,
                        isDarkMode && index % 2 === 1 && styles.ayahOddDark,
                        pressedAyah === item.number ? styles.pressed : {},
                        checkedAyat.has(item.number) ? styles.checked : {},
                        highlightedAyat === item.number ? styles.highlighted : {},
                        selection.start &&
                        item.number >= selection.start &&
                        selection.end &&
                        item.number <= selection.end
                          ? styles.selected
                          : {},
                      ]}
                    >
                      <View style={styles.badgeRow}>
                        {isSelectingRange && (
                          <Feather
                            name={checkedAyat.has(item.number) ? 'check-circle' : 'circle'}
                            size={20}
                            color={checkedAyat.has(item.number) ? '#10b981' : '#E5E5E5'}
                            style={{ marginTop: 2, marginRight: 4 }}
                          />
                        )}
                        <Pressable
                          style={styles.badge}
                          onPress={() =>
                            scrollToAyat(
                              ayahItem.number,
                              isJuzMode ? ayahItem.surahNumber : undefined
                            )
                          }
                          hitSlop={8}
                        >
                          <LogoAyat1 width={38} height={38} />
                          <Text style={styles.badgeText}>{item.number}</Text>
                        </Pressable>
                        <Text style={styles.arabic}>
                          {ayahItem.text}{' '}
                          <Text style={styles.ayahNumberInline}>
                            {getArabicNumber(ayahItem.number)}
                          </Text>
                        </Text>
                      </View>
                      {showTransliteration && ayahItem.transliteration && (
                        <Text
                          style={[styles.transliteration, isDarkMode && styles.transliterationDark]}
                        >
                          {ayahItem.transliteration}
                        </Text>
                      )}
                      {showTranslation && (
                        <Text style={[styles.translation, isDarkMode && styles.translationDark]}>
                          {ayahItem.translation}
                        </Text>
                      )}
                    </Pressable>
                  </>
                );
              }}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={viewConfigRef.current}
            />
          );
        }}
      />
      {(isSelectingRange || selectedCount > 0) && (
        <View style={styles.floatingContainer}>
          <View style={styles.floatingCard}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.floatingTitle}>
                {isSelectingRange
                  ? `${checkedAyat.size} ayat dipilih${checkedAyat.size > 1 ? ' (range)' : ''}`
                  : `${selectedCount} ayat selesai! 🎉`}
              </Text>
              {isSelectingRange && (
                <Text
                  style={[styles.floatingSubtitle, { fontSize: 12, marginTop: 4, opacity: 0.7 }]}
                >
                  Tap ayat untuk range selection
                </Text>
              )}
            </View>
            <View
              style={[
                styles.floatingButtons,
                isSelectingRange && { flexDirection: 'column', gap: 12 },
              ]}
            >
              {isSelectingRange ? (
                <>
                  <Pressable
                    style={[
                      styles.outlineBtn,
                      { flexDirection: 'row', justifyContent: 'center', gap: 6 },
                    ]}
                    onPress={() => {
                      setCheckedAyat(new Set());
                    }}
                  >
                    <Feather name="x" size={16} color="#6B7280" />
                    <Text style={styles.outlineBtnText}>Clear</Text>
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => {
                        setCheckedAyat(new Set());
                        setIsSelectingRange(false);
                      }}
                    >
                      <Text style={styles.outlineBtnText}>Batal</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryBtn, checkedAyat.size === 0 && { opacity: 0.5 }]}
                      disabled={checkedAyat.size === 0}
                      onPress={() => {
                        if (checkedAyat.size > 0) {
                          // Directly call handleLog with checkbox selection
                          handleLog();
                        }
                      }}
                    >
                      <Text style={styles.primaryBtnText}>Selesai ({checkedAyat.size})</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => {
                      const next = (selection.end || selection.start || 1) + 1;
                      resetSelection();
                      setIsSelectingRange(false);
                      scrollToAyat(next);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Lanjut Baca</Text>
                  </Pressable>
                  {!isJuzMode && selectedCount > 0 && (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={async () => {
                        if (!surah) return;
                        const start = selection.start as number;
                        const end = (selection.end ?? selection.start) as number;
                        const lines = surah.ayat
                          .filter((a) => a.number >= start && a.number <= end)
                          .map((a) => `${a.text}\n\n${a.translation || ''}\n`)
                          .join('\n');
                        const ref = `(QS. ${surah.name}: ${start}${end && end !== start ? `-${end}` : ''})`;
                        try {
                          await Clipboard.setStringAsync(`${lines}\n${ref}`);
                          showSuccessToast(
                            'Ayat Disalin! 📋',
                            `${end - start + 1} ayat dari ${surah.name}`
                          );
                        } catch (err) {
                          showErrorToast('Gagal Menyalin');
                        }
                      }}
                    >
                      <Text style={styles.outlineBtnText}>Salin</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.outlineBtn}
                    onPress={() => {
                      handleLog();
                      resetSelection();
                      setIsSelectingRange(false);
                    }}
                  >
                    <Text style={styles.outlineBtnText}>Lihat Progress</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      )}
      {pressedAyah && (
        <Pressable style={styles.actionModalBackdrop} onPress={() => setPressedAyah(null)}>
          <View style={styles.actionModal}>
            <Text style={styles.actionModalTitle}>Ayat {pressedAyah}</Text>
            <Pressable
              style={styles.actionOption}
              onPress={async () => {
                if (pressedAyah && surah) {
                  const ayahData = surah.ayat.find((a: Ayah) => a.number === pressedAyah);
                  const translationData = translation?.ayat?.find(
                    (a: Ayah) => a.number === pressedAyah
                  );

                  if (ayahData) {
                    let textToCopy = ayahData.text;

                    // Add translation if available
                    if (translationData?.translation) {
                      textToCopy += `\n\n${translationData.translation}`;
                    }

                    await Clipboard.setStringAsync(textToCopy);
                    showSuccessToast(
                      'Ayat & Terjemahan Disalin',
                      `Surah ${surah.number} ayat ${pressedAyah}`
                    );
                    setPressedAyah(null);
                  }
                }
              }}
            >
              <Feather name="copy" size={20} color="#2D3436" />
              <Text style={styles.actionOptionText}>Salin Ayat</Text>
            </Pressable>
            <Pressable
              style={styles.actionOption}
              onPress={async () => {
                if (pressedAyah && surah) {
                  if (isBookmarked) {
                    Alert.alert('Sudah di Bookmark', 'Ayat ini sudah tersimpan di bookmark');
                    setPressedAyah(null);
                    return;
                  }

                  setShowFolderModal(true);
                }
              }}
            >
              <Feather name="bookmark" size={20} color="#2D3436" />
              <Text style={styles.actionOptionText}>
                {isBookmarked ? 'Sudah di Bookmark' : 'Tambah ke Bookmark'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionOption}
              onPress={async () => {
                if (pressedAyah && surah) {
                  const surahName =
                    isJuzMode && visibleSurahInfo ? visibleSurahInfo.surahName : surah.name;
                  const currentSurah =
                    isJuzMode && visibleSurahInfo ? visibleSurahInfo.surahNumber : surahNumber;

                  await markAsLastRead(
                    currentSurah,
                    pressedAyah,
                    surahName,
                    getJuzForAyah(currentSurah, pressedAyah),
                    getPageForAyah(currentSurah, pressedAyah)
                  );
                  setPressedAyah(null);
                }
              }}
            >
              <Feather name="flag" size={20} color="#2D3436" />
              <Text style={styles.actionOptionText}>Tandai Terakhir Baca</Text>
            </Pressable>
            <Pressable
              style={styles.actionOption}
              onPress={() => {
                setPressedAyah(null);
                setIsSelectingRange(true);
                setCheckedAyat(new Set());
              }}
            >
              <Feather name="check-circle" size={20} color="#10b981" />
              <Text style={[styles.actionOptionText, { color: '#10b981' }]}>Catat Bacaan</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      {/* Folder Selection Modal */}
      <Modal
        visible={showFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFolderModal(false)}>
          <Pressable style={styles.folderModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.folderModalTitle}>Pilih Folder Bookmark</Text>

            {/* Create New Folder Button */}
            <Pressable style={styles.createFolderButton} onPress={handleCreateNewFolder}>
              <Feather name="folder-plus" size={20} color="#2D3436" />
              <Text style={styles.createFolderText}>Buat Folder Baru</Text>
            </Pressable>

            {/* Existing Folders */}
            <ScrollView style={styles.folderList} showsVerticalScrollIndicator={false}>
              {availableFolders.map((folderName, index) => (
                <Pressable
                  key={index}
                  style={styles.folderItem}
                  onPress={() => handleBookmarkSelection(folderName)}
                >
                  <Feather name="folder" size={20} color="#2D3436" />
                  <Text style={styles.folderText}>{folderName}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Cancel Button */}
            <Pressable style={styles.cancelButton} onPress={() => setShowFolderModal(false)}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Folder Input Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateFolderModal(false)}>
          <Pressable style={styles.inputModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.inputModalTitle}>Buat Folder Baru</Text>

            <TextInput
              style={styles.folderInput}
              placeholder="Masukkan nama folder..."
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleCreateFolderSubmit}
            />

            <View style={styles.inputModalButtons}>
              <Pressable
                style={[styles.inputModalButton, styles.cancelInputButton]}
                onPress={() => setShowCreateFolderModal(false)}
              >
                <Text style={styles.cancelInputButtonText}>Batal</Text>
              </Pressable>

              <Pressable
                style={[styles.inputModalButton, styles.createInputButton]}
                onPress={handleCreateFolderSubmit}
              >
                <Text style={styles.createInputButtonText}>Buat</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <JumpToSurahModal
        visible={showJumpModal}
        onClose={() => setShowJumpModal(false)}
        onJump={handleJump}
        currentSurah={isJuzMode ? visibleSurahInfo?.surahNumber || surahNumber : surahNumber}
        surahList={surahList.map((s) => ({
          number: s.number,
          name: s.name,
          ayat_count: s.ayat_count,
        }))}
      />

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        showTransliteration={showTransliteration}
        setShowTransliteration={setShowTransliteration}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingRight: 2,
    paddingTop: 36,
    paddingBottom: 22,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 88,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerCenterAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 46,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 0,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  headerNavBar: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomColor: '#F3F4F6',
    paddingVertical: 5,
    marginTop: -8,
  },
  headerNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerNavLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerNavRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerNavButton: {
    alignItems: 'flex-start',
  },
  headerNavLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerNavText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
    marginRight: -2,
  },
  iconButton: { padding: 8 },
  ayahContainer: {
    paddingVertical: 12,
    paddingHorizontal: 7,
    borderBottomColor: '#f1f1f1',
    borderBottomWidth: 1,
    overflow: 'visible',
  },
  ayahEven: {
    backgroundColor: '#FFFFFF',
  },
  ayahOdd: {
    backgroundColor: '#FFF8F0',
  },
  pressed: {
    backgroundColor: '#FFE5DC',
  },
  checked: {
    backgroundColor: '#E8F5E9',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 8,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  badgeText: {
    position: 'absolute',
    color: '#2D3436',
    fontSize: 12,
    fontWeight: '700',
  },
  arabic: {
    fontSize: 25,
    lineHeight: 56,
    textAlign: 'right',
    fontFamily: 'LPMQ-Isep-Misbah',
    paddingVertical: 4,
    paddingRight: 0,
    overflow: 'visible',
    flex: 1,
  },
  ayahNumberInline: {
    fontSize: 25,
    fontFamily: 'LPMQ-Isep-Misbah',
    color: '#4B5563',
    fontWeight: '600',
  },

  translation: {
    fontSize: 16,
    color: '#2D3436',
    marginTop: -5,
    marginLeft: 8,
    textAlign: 'left',
    paddingHorizontal: 18,
    paddingRight: 0,
  },
  translationDark: {
    color: '#E5E5E5',
  },
  transliteration: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 8,
    textAlign: 'left',
    paddingHorizontal: 18,
    paddingRight: 0,
  },
  transliterationDark: {
    color: '#9CA3AF',
  },
  containerDark: {
    backgroundColor: '#1F2937',
  },
  topBarDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  headerSubtitleDark: {
    color: '#D1D5DB',
  },
  headerNavBarDark: {
    backgroundColor: '#111827',
    borderBottomColor: '#374151',
  },
  headerNavLabelDark: {
    color: '#6B7280',
  },
  headerNavTextDark: {
    color: '#E5E7EB',
  },
  ayahEvenDark: {
    backgroundColor: '#1F2937',
  },
  ayahOddDark: {
    backgroundColor: '#111827',
  },
  number: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  selected: { backgroundColor: colors.primary + '10' },
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: 'center',
  },
  floatingCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  floatingTitle: { color: '#111827', fontWeight: '600', fontSize: 17, marginBottom: 4 },
  floatingSubtitle: { color: '#6B7280', fontSize: 13 },
  floatingButtons: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: { color: '#374151', fontWeight: '500', fontSize: 14 },
  highlighted: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  toolbarText: { fontWeight: '600', color: colors.text.primary },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  cancel: { color: '#ef4444', marginLeft: 12 },
  actionModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionOptionText: {
    fontSize: 16,
    color: '#2D3436',
  },
  // Folder Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  folderModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  createFolderText: {
    fontSize: 16,
    color: '#2D3436',
    marginLeft: 12,
    fontWeight: '500',
  },
  folderList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 4,
  },
  folderText: {
    fontSize: 16,
    color: '#2D3436',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Input Modal Styles
  inputModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  inputModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  folderInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#2D3436',
    backgroundColor: '#F8F9FA',
    marginBottom: 24,
  },
  inputModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inputModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelInputButton: {
    backgroundColor: '#6C757D',
  },
  createInputButton: {
    backgroundColor: '#10b981',
  },
  cancelInputButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  createInputButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
