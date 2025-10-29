import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
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
import { loadJuzContent, getJuzTitle, AyahWithSurahInfo } from '@/services/quran/juzUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { getPageForAyah } from '@/services/quran/pageMap';
import { getJuzNumber } from '@/services/quran/quranHelpers';
import { calculateSelectionHasanat } from '@/services/hasanatUtils';
import QuranSurahHeader from './components/QuranSurahHeader';
import { markAsLastRead } from '@/services/quran/bookmarkService';
import LogoAyat1 from '../../../assets/nomorayat/logoayat1.svg';
import {
  addBookmark,
  isAyatBookmarked,
  createFolderAndMoveBookmark,
  getBookmarkFolders,
  createEmptyFolder,
} from '@/services/quran/favoriteBookmarks';
import { loadSurahTranslation } from '@/services/quran/quranData';

export default function ReaderScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { surahNumber: pSurah, ayatNumber: pAyat, juzNumber } = route.params || {};
  const [surahNumber, setSurahNumber] = useState<number>(pSurah || 1);
  const [bookmarkAyat, setBookmarkAyat] = useState<number | null>(pAyat ?? null);
  const listRef = useRef<FlatList>(null);
  const [visibleAyat, setVisibleAyat] = useState<number>(1);
  const [visiblePage, setVisiblePage] = useState<number | null>(null);
  const [pressedAyah, setPressedAyah] = useState<number | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [checkedAyat, setCheckedAyat] = useState<Set<number>>(new Set());
  const [visibleSurahInfo, setVisibleSurahInfo] = useState<{
    surahNumber: number;
    surahName: string;
  } | null>(null);
  const [selectedHasanat, setSelectedHasanat] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [translation, setTranslation] = useState<any>(null);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  // Juz mode state
  const [isJuzMode] = useState(!!juzNumber);
  const [juzAyat, setJuzAyat] = useState<AyahWithSurahInfo[]>([]);
  const [juzTitle, setJuzTitle] = useState<string>('');
  const [juzLoading, setJuzLoading] = useState(false);

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
      const currentJuz = isJuzMode ? juzNumber : getJuzNumber(currentSurah, pressedAyah);

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

  const { surah, loading, selection, selectAyah, resetSelection, showTranslation } = useQuranReader(
    surahNumber,
    'id'
  );

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
  }, [selection.start, selection.end, surah, checkedAyat, isSelectingRange, surahNumber]);

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

  // Load translation when surah changes
  useEffect(() => {
    (async () => {
      if (surahNumber) {
        try {
          const translationData = await loadSurahTranslation(surahNumber, 'id');
          setTranslation(translationData);
        } catch (error) {
          console.error('Error loading translation:', error);
        }
      }
    })();
  }, [surahNumber]);

  // Load folders when component mounts
  useEffect(() => {
    loadFolders();
  }, []);

  // Load Juz content if in Juz mode
  useEffect(() => {
    if (juzNumber && isJuzMode) {
      setJuzLoading(true);
      Promise.all([loadJuzContent(juzNumber), getJuzTitle(juzNumber)])
        .then(([ayat, title]) => {
          setJuzAyat(ayat);
          setJuzTitle(title);
          setJuzLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Juz:', err);
          setJuzLoading(false);
        });
    }
  }, [juzNumber, isJuzMode]);

  // Auto-scroll to bookmark ayat
  useEffect(() => {
    if (bookmarkAyat && listRef.current && surah?.ayat && !isJuzMode) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: Math.max(0, bookmarkAyat - 1),
            animated: true,
          });
        } catch {}
      }, 300);
    } else if (bookmarkAyat && listRef.current && juzAyat.length > 0 && isJuzMode) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: Math.max(0, bookmarkAyat - 1),
            animated: true,
          });
        } catch {}
      }, 300);
    }
  }, [bookmarkAyat, surahNumber, surah?.ayat, juzAyat, isJuzMode]);

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 30 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstItem = viewableItems[0]?.item as AyahWithSurahInfo | undefined;
      const first = firstItem?.number;
      if (typeof first === 'number') setVisibleAyat(first);
      if (isJuzMode) {
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
  });

  const scrollToAyat = (ayat: number) => {
    try {
      listRef.current?.scrollToIndex({ index: Math.max(0, ayat - 1), animated: true });
    } catch {}
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

  if (
    (loading && !isJuzMode) ||
    juzLoading ||
    (!surah && !isJuzMode) ||
    (isJuzMode && juzAyat.length === 0)
  ) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const totalAyat = displayAyat.length;
  // Use first visible item's page for both Juz and Surah mode
  const currentPage = visiblePage;
  const progress = totalAyat ? Math.max(0, Math.min(100, (visibleAyat / totalAyat) * 100)) : 0;

  // Build header subtitle
  const getSubtitle = () => {
    if (isJuzMode) {
      const name = visibleSurahInfo?.surahName || '';
      const hlm = currentPage ?? '-';
      return name ? `${name} | Hlm. ${hlm}` : `Hlm. ${hlm}`;
    }
    const hlm = currentPage ?? '-';
    return `Hlm. ${hlm}`;
  };
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

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.topBar}>
        <Pressable onPress={() => (navigation as any)?.goBack?.()} style={styles.iconButton}>
          <Feather name="arrow-left" size={20} color="#2D3436" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{isJuzMode ? displayTitle : surah?.name || ''}</Text>
          <Text style={styles.headerSubtitle}>{getSubtitle()}</Text>
        </View>
        <Pressable style={styles.iconButton}>
          <Feather name="bookmark" size={20} color="#2D3436" />
        </Pressable>
      </View>
      {/* JumpBar and QuickRangeBar removed */}
      <FlatList
        ref={listRef}
        data={displayAyat}
        keyExtractor={(item, index) => `${item.number}_${index}`}
        contentContainerStyle={{
          paddingBottom: isSelectingRange || selectedCount > 0 ? 120 : 20,
        }}
        ListHeaderComponent={
          !isJuzMode ? (
            <>
              <QuranSurahHeader
                revelation={surahNumber && surahNumber <= 7 ? 'Mekah' : 'Madinah'}
                surahNumber={surahNumber}
                surahName={surah?.name || ''}
                meaning={undefined}
                totalAyahs={surah?.ayat?.length}
                surahNameAr={undefined}
              />
              {surahNumber !== 1 && surahNumber !== 9 ? <BasmalahHeader /> : null}
            </>
          ) : null
        }
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
                  pressedAyah === item.number ? styles.pressed : {},
                  checkedAyat.has(item.number) ? styles.checked : {},
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
                      color={checkedAyat.has(item.number) ? '#00C896' : '#E5E5E5'}
                      style={{ marginTop: 2, marginRight: 4 }}
                    />
                  )}
                  <View style={styles.badge}>
                    <LogoAyat1 width={25} height={25} />
                    <Text style={styles.badgeText}>{item.number}</Text>
                  </View>
                  <Text style={styles.arabic}>
                    {item.text}{' '}
                    <Text style={styles.ayahNumberInline}>{getArabicNumber(item.number)}</Text>
                  </Text>
                </View>
                {showTranslation && <Text style={styles.translation}>{ayahItem.translation}</Text>}
              </Pressable>
            </>
          );
        }}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewConfigRef.current}
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
                  const ayahData = surah.ayat.find((a) => a.number === pressedAyah);
                  const translationData = translation?.ayat?.find(
                    (a: any) => a.number === pressedAyah
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
                  const currentSurah =
                    isJuzMode && visibleSurahInfo ? visibleSurahInfo.surahNumber : surahNumber;

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
                    getJuzNumber(currentSurah, pressedAyah),
                    getPageNumber(currentSurah, pressedAyah)
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
              <Feather name="check-circle" size={20} color="#00C896" />
              <Text style={[styles.actionOptionText, { color: '#00C896' }]}>Catat Bacaan</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  progressFill: { height: '100%', backgroundColor: '#00C896' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFF8F0',
  },
  iconButton: { padding: 8 },
  headerTitle: { color: '#2D3436', fontWeight: '500' },
  headerSubtitle: { color: '#636E72', fontSize: 12, marginTop: 2 },
  ayahContainer: {
    paddingVertical: 10,
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
    width: 25,
    height: 25,
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
    fontSize: 10,
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
    color: '#795c40',
    marginTop: -5,
    marginLeft: 8,
    textAlign: 'left',
    paddingHorizontal: 18,
    paddingRight: 0,
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
    backgroundColor: '#00C896',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C896',
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
    backgroundColor: '#00C896',
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
