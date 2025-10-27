import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuranReader } from './useQuranReader';
import { colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createReadingSession, ReadingSessionInput } from '@/services/reading';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import BasmalahHeader from '@/features/quran/components/BasmalahHeader';

export default function ReaderScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { surahNumber: pSurah, ayatNumber: pAyat } = route.params || {};
  const [surahNumber, setSurahNumber] = useState<number>(pSurah || 1);
  const [bookmarkAyat, setBookmarkAyat] = useState<number | null>(pAyat ?? null);
  const listRef = useRef<FlatList>(null);
  const [visibleAyat, setVisibleAyat] = useState<number>(1);
  const [pressedAyah, setPressedAyah] = useState<number | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [checkedAyat, setCheckedAyat] = useState<Set<number>>(new Set());

  const getArabicNumber = (num: number): string => {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num
      .toString()
      .split('')
      .map((digit) => arabic[parseInt(digit)])
      .join('');
  };

  const { surah, loading, selection, selectAyah, resetSelection, showTranslation } = useQuranReader(
    surahNumber,
    'id'
  );

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

  // Auto-scroll to bookmark ayat
  useEffect(() => {
    if (bookmarkAyat && listRef.current && surah?.ayat) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: Math.max(0, bookmarkAyat - 1),
            animated: true,
          });
        } catch {}
      }, 300);
    }
  }, [bookmarkAyat, surahNumber, surah?.ayat]);

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 30 });
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const first = viewableItems[0]?.item?.number;
      if (typeof first === 'number') setVisibleAyat(first);
    }
  });

  const scrollToAyat = (ayat: number) => {
    try {
      listRef.current?.scrollToIndex({ index: Math.max(0, ayat - 1), animated: true });
    } catch {}
  };

  const logMutation = useMutation({
    mutationFn: (input: ReadingSessionInput) => createReadingSession(input),
    onSuccess: () => resetSelection(),
  });

  const handleLog = async () => {
    if (!selection.start || !selection.end || !surah) return;

    logMutation.mutate({
      surah_number: surah.number,
      ayat_start: selection.start,
      ayat_end: selection.end,
    });
  };

  const handleAyahPress = (number: number) => {
    if (isSelectingRange) {
      // Toggle check/uncheck ayat
      setCheckedAyat((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(number)) {
          newSet.delete(number);
        } else {
          newSet.add(number);
        }
        return newSet;
      });
    } else {
      setPressedAyah(number);
    }
  };

  if (loading || !surah) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const totalAyat = surah?.ayat_count || surah?.ayat?.length || 0;
  const progress = totalAyat ? Math.max(0, Math.min(100, (visibleAyat / totalAyat) * 100)) : 0;
  const selectedCount = selection.start
    ? selection.end
      ? selection.end - selection.start + 1
      : 1
    : 0;

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
          <Text style={styles.headerTitle}>{surah.name}</Text>
          <Text style={styles.headerSubtitle}>
            Ayah {visibleAyat} / {totalAyat}
          </Text>
        </View>
        <Pressable style={styles.iconButton}>
          <Feather name="bookmark" size={20} color="#2D3436" />
        </Pressable>
      </View>
      {/* JumpBar and QuickRangeBar removed */}
      <FlatList
        ref={listRef}
        data={surah.ayat}
        keyExtractor={(item) => `${item.number}`}
        ListHeaderComponent={surahNumber !== 1 && surahNumber !== 9 ? <BasmalahHeader /> : null}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => handleAyahPress(item.number)}
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
                <Text style={styles.badgeText}>{item.number}</Text>
              </View>
              <Text style={styles.arabic}>
                {item.text}{' '}
                <Text style={styles.ayahNumberInline}>{getArabicNumber(item.number)}</Text>
              </Text>
            </View>
            {showTranslation && <Text style={styles.translation}>{item.translation}</Text>}
          </Pressable>
        )}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewConfigRef.current}
      />
      {(isSelectingRange || selectedCount > 0) && (
        <View style={styles.floatingContainer}>
          <View style={styles.floatingCard}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.floatingTitle}>
                {isSelectingRange
                  ? `${checkedAyat.size} ayat dipilih`
                  : `${selectedCount} ayat selesai! 🎉`}
              </Text>
              {!isSelectingRange && selectedCount > 0 && (
                <Text style={styles.floatingSubtitle}>
                  <Text style={{ color: '#FFB627', fontWeight: '600' }}>{selectedCount * 10}+</Text>{' '}
                  hasanat hari ini!
                </Text>
              )}
            </View>
            <View
              style={[
                styles.floatingButtons,
                isSelectingRange && { flexDirection: 'column', gap: 8 },
              ]}
            >
              {isSelectingRange ? (
                <>
                  <Pressable
                    style={[styles.outlineBtn, { flexDirection: 'row', justifyContent: 'center' }]}
                    onPress={() => {
                      setCheckedAyat(new Set());
                    }}
                  >
                    <Feather name="x-circle" size={20} color="#2D3436" />
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
                          const sorted = Array.from(checkedAyat).sort((a, b) => a - b);
                          const start = sorted[0];
                          const end = sorted[sorted.length - 1];

                          // Set selection (auto-range)
                          selectAyah(start);
                          selectAyah(end);

                          // Close selection mode
                          setCheckedAyat(new Set());
                          setIsSelectingRange(false);
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
              onPress={() => {
                /* Salin ayat */
              }}
            >
              <Feather name="copy" size={20} color="#2D3436" />
              <Text style={styles.actionOptionText}>Salin Ayat</Text>
            </Pressable>
            <Pressable
              style={styles.actionOption}
              onPress={() => {
                /* Tambah bookmark */
              }}
            >
              <Feather name="bookmark" size={20} color="#2D3436" />
              <Text style={styles.actionOptionText}>Tambah ke Bookmark</Text>
            </Pressable>
            <Pressable
              style={styles.actionOption}
              onPress={() => {
                /* Tandai terakhir baca */
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  progressFill: { height: '100%', backgroundColor: '#00C896' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    backgroundColor: '#2d3436',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
    bottom: 24,
    alignItems: 'center',
  },
  floatingCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floatingTitle: { color: '#2D3436', fontWeight: '600', fontSize: 18, marginBottom: 4 },
  floatingSubtitle: { color: '#636E72', fontSize: 14 },
  floatingButtons: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#00C896',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  outlineBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  outlineBtnText: { color: '#2D3436', fontWeight: '600' },
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
});
