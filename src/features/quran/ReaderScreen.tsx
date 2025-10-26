import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useQuranReader } from './useQuranReader';
import { colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createReadingSession, ReadingSessionInput } from '@/services/reading';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import JumpBar from '@/features/quran/JumpBar';
import QuickRangeBar from '@/features/quran/QuickRangeBar';
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
  const [twoSpaceWidth, setTwoSpaceWidth] = useState<number>(8);
  const [ayahPositions, setAyahPositions] = useState<Record<number, { left: number; top: number }>>(
    {}
  );
  const AYAH_SYMBOL_SIZE = 32;

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

  if (loading || !surah) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text
        style={styles.measure}
        onTextLayout={(e) => {
          const w = e.nativeEvent?.lines?.[0]?.width;
          if (typeof w === 'number' && w > 0 && w !== twoSpaceWidth) setTwoSpaceWidth(w);
        }}
      >
        {'  '}
      </Text>
      <JumpBar
        currentSurah={surahNumber}
        onJump={(s, a) => {
          if (s !== surahNumber) {
            navigation.replace('Reader', { surahNumber: s, ayatNumber: a });
          } else {
            scrollToAyat(a);
          }
        }}
      />
      <QuickRangeBar
        currentAyat={visibleAyat || 1}
        totalAyat={surah?.ayat_count || (surah?.ayat?.length ?? 0) || 7}
        onPickRange={(start, end) => {
          if (start) {
            selectAyah(start);
            if (end && end !== start) selectAyah(end);
          }
        }}
      />
      <FlatList
        ref={listRef}
        data={surah.ayat}
        keyExtractor={(item) => `${item.number}`}
        ListHeaderComponent={surahNumber !== 1 && surahNumber !== 9 ? <BasmalahHeader /> : null}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectAyah(item.number)}
            style={[
              styles.ayahContainer,
              selection.start &&
              item.number >= selection.start &&
              selection.end &&
              item.number <= selection.end
                ? styles.selected
                : {},
            ]}
          >
            <View style={{ position: 'relative' }}>
              <Text
                style={styles.arabic}
                onTextLayout={(e) => {
                  const lines = e.nativeEvent?.lines || [];
                  if (!lines.length) return;
                  const last = lines[lines.length - 1];
                  // Position setelah akhir huruf terakhir di baris terakhir
                  const left = (last.x || 0) - AYAH_SYMBOL_SIZE - twoSpaceWidth;
                  const top = (last.y || 0) + ((last.height || 0) - AYAH_SYMBOL_SIZE) / 2;
                  setAyahPositions((prev) => ({ ...prev, [item.number]: { left, top } }));
                }}
              >
                {item.text}
              </Text>
              {ayahPositions[item.number] && (
                <View style={[styles.ayahSymbolContainer, ayahPositions[item.number]]}>
                  <Svg width={28} height={28} viewBox="0 -410 1248 1665">
                    <Path d="M1248 4q-42-7-66.5-15T1138-30.5t-38.5-29T1047-103q-68-56-127.5-86T803-238q-39-13-64.5-29T694-304t-34.5-47-34.5-59q-19 33-34.5 59T556-304t-44.5 37-64.5 29q-57 19-116.5 49T203-103q-33 26-52.5 43.5t-38.5 29T68-11 0 4q29 34 59.5 57.5T125 92q-48 71-73 154.5T27 421q0 93 25 176t73 154q-35 8-65.5 31T0 839q43 8 68 16t44 19.5 38.5 29T203 948q68 53 127.5 84t116.5 51q39 12 64.5 28t44.5 36.5 34.5 47T625 1255q19-34 34.5-60.5t34.5-47 44.5-36.5 64.5-28q57-20 117-51t127-84q33-27 52.5-44.5t38.5-29 43.5-19.5 66.5-16q-28-34-58-57t-65-31q48-71 73-154t25-176q0-91-25-174.5T1125 92q35-7 65-30.5T1248 4m-76 811q-23 8-42.5 19t-37.5 24-35 27.5-35 29.5q-65 54-121 82t-110 47q-32 11-56.5 23.5T691 1096t-35 35.5-31 43.5q-15-24-31-43.5t-35-35.5-43.5-28.5T459 1044q-54-19-110-47t-121-82q-18-15-35-29.5T158 858t-37.5-24T78 815q22-16 43.5-21.5t42.5-3 42 12 42 22.5q9-11 21.5-24t27.5-13q8 0 22.5 13.5t35 29.5 47.5 29.5 59 13.5 54-2 40-8 34.5-17.5T625 817q19 18 35.5 29.5T695 864t40.5 8 53.5 2q32 0 59-13.5t47.5-29.5 35-29.5T953 788q15 0 27.5 13t21.5 24q21-13 42-22.5t42.5-12 43 3T1172 815m22-394q0 93-26 176t-76 152q-20 0-38.5 5.5T1010 774q-11-11-26.5-19t-30.5-8q-18 0-35.5 14t-37 30.5-41.5 30-50 13.5q-34 0-55-3t-37.5-11-32-23-39.5-39q-24 24-39.5 39T554 821t-37 11-56 3q-28 0-50-13.5t-41-30-36.5-30.5-36.5-14q-15 0-30.5 8T240 774q-26-14-44-19.5t-38-5.5q-49-69-75.5-152T56 421q0-91 26.5-173.5T158 94q20 2 38-4t44-19q11 9 26.5 18t30.5 9q19 0 36.5-13.5t36.5-30T411 24t50-14q35 0 56 3t37 11 31.5 23T625 86q24-24 39.5-39t32-23T734 13t55-3q28 0 50 14t41.5 30.5 37 30T953 98q15 0 30.5-9t26.5-18q25 13 43.5 19t38.5 4q50 71 76 153.5t26 173.5m-22-393q-43 32-85.5 24.5T1002 20q-9 11-21.5 24T953 57q-8 0-22.5-13.5t-35-30T848-17t-59-14q-31 0-53.5 2.5t-40.5 9-34.5 18T625 28q-19-18-35.5-29.5t-34.5-18-40-9-54-2.5-59 14-47.5 30.5-35 30T297 57q-15 0-27.5-13T248 20q-42 25-84 32.5T78 28q23-7 42.5-18T158-14.5t35-28T228-72q65-53 121-81.5T459-199q32-12 56.5-25t43.5-28.5 35-34.5 31-43q15 24 31 43t35 34.5 43.5 28.5 56.5 25q54 17 110 45.5T1022-72q18 15 35 29.5t35 28 37.5 24.5 42.5 18M957 884q7-7 5.5-15t-7-13-14-5.5T926 858q-20 24-56.5 44T781 933q-9 3-12.5 10t-2 14.5 8 12T791 972q56-12 98-34.5t68-53.5m-264 86q0-28-20-47.5T625 903t-48 19.5-20 47.5q0 29 20 49.5t48 20.5 48-20.5 20-49.5m-224-37q-52-11-88.5-31T324 858q-7-8-15-7.5t-14 5.5-7.5 13 5.5 15q26 31 68 53.5t98 34.5q10 2 16.5-2.5t8-12-2-14.5-12.5-10M957-39q-53-63-166-90-10-2-16.5 3t-8 12.5 2 15T781-89q52 11 88.5 30T926-15q7 8 15.5 8t14-4.5 7-12.5-5.5-15m-264-88q0-28-20-48t-48-20-48 20-20 48q0 29 20 48t48 19 48-19 20-48M469-89q9-2 12.5-9.5t2-15-8-12.5-16.5-3q-113 27-166 90-7 7-5.5 15t7.5 12.5T309-7t15-8q20-25 56.5-44T469-89" />
                  </Svg>
                  <Text style={styles.ayahNumberInSymbol}>{getArabicNumber(item.number)}</Text>
                </View>
              )}
            </View>
            {showTranslation && <Text style={styles.translation}>{item.translation}</Text>}
            <Text style={styles.number}>{item.number}</Text>
          </Pressable>
        )}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewConfigRef.current}
      />
      {selection.start > 0 && (
        <View style={styles.toolbar}>
          <Text style={styles.toolbarText}>
            {selection.end ? `Ayat ${selection.start}–${selection.end}` : `Ayat ${selection.start}`}
          </Text>
          <Pressable onPress={handleLog} style={styles.button}>
            <Text style={styles.buttonText}>Catat Bacaan</Text>
          </Pressable>
          <Pressable onPress={resetSelection}>
            <Text style={styles.cancel}>Batal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  ayahContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomColor: '#f1f1f1',
    borderBottomWidth: 1,
    overflow: 'visible',
  },
  arabic: {
    fontSize: 28,
    lineHeight: 52,
    textAlign: 'right',
    fontFamily: 'AmiriQuran-Regular',
    paddingVertical: 4,
    overflow: 'visible',
    flexShrink: 1,
  },
  ayahWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    fontFamily: 'AmiriQuran-Regular',
    fontSize: 28,
    includeFontPadding: false,
  },
  ayahSymbolContainer: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberInSymbol: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'AmiriQuran-Regular',
    color: '#1F2937',
    fontWeight: '600',
    top: '50%',
    marginTop: -5,
  },
  translation: { fontSize: 16, color: '#4b5563', marginTop: 8, textAlign: 'left' },
  number: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  selected: { backgroundColor: colors.primary + '10' },
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
});
