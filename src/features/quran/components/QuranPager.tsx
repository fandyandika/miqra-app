import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import PagerView from 'react-native-pager-view';
import { Platform, StyleSheet, View } from 'react-native';

interface QuranPagerProps {
  initialSurah?: number;
  initialJuz?: number;
  isJuzMode: boolean;
  onSurahChange?: (surah: number) => void;
  onJuzChange?: (juz: number) => void;
  renderPage: (surah?: number, juz?: number) => React.ReactNode;
}

export default function QuranPager({
  initialSurah = 1,
  initialJuz,
  isJuzMode,
  onSurahChange,
  onJuzChange,
  renderPage,
}: QuranPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const [surah, setSurah] = useState(initialSurah);
  const [juz, setJuz] = useState(initialJuz || 1);
  const isIdle = useRef(true);
  const pending = useRef(0);

  const pages = useMemo(() => {
    if (isJuzMode) {
      const prev = Math.max(1, juz - 1);
      const next = Math.min(30, juz + 1);
      return { prev, curr: juz, next };
    } else {
      const prev = Math.max(1, surah - 1);
      const next = Math.min(114, surah + 1);
      return { prev, curr: surah, next };
    }
  }, [surah, juz, isJuzMode]);

  // Sync with external changes
  useEffect(() => {
    if (isJuzMode && initialJuz && initialJuz !== juz) {
      setJuz(initialJuz);
      requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
    } else if (!isJuzMode && initialSurah !== surah) {
      setSurah(initialSurah);
      requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
    }
  }, [initialSurah, initialJuz, isJuzMode]);

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  const flush = () => {
    if (!pending.current) return;

    if (isJuzMode) {
      const newJuz = clamp(juz + pending.current, 1, 30);
      if (newJuz !== juz) {
        setJuz(newJuz);
        onJuzChange?.(newJuz);
      }
    } else {
      const newSurah = clamp(surah + pending.current, 1, 114);
      if (newSurah !== surah) {
        setSurah(newSurah);
        onSurahChange?.(newSurah);
      }
    }

    pending.current = 0;
    requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
  };

  const onPageScrollStateChanged = (e: any) => {
    isIdle.current = e.nativeEvent.pageScrollState === 'idle';
    if (isIdle.current) flush();
  };

  const onPageSelected = (e: any) => {
    const delta = e.nativeEvent.position - 1; // -1,0,+1
    if (!delta) return;

    // Quran reverse swipe: swipe LEFT (page 2) -> PREVIOUS, swipe RIGHT (page 0) -> NEXT
    const reverseDelta = delta === 1 ? -1 : delta === -1 ? 1 : 0;
    pending.current += reverseDelta;

    // Flush immediately on page change for instant feedback
    flush();
  };

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={1}
      offscreenPageLimit={1}
      pageMargin={Platform.OS === 'android' ? 10 : 0}
      overdrag={true}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {/* Prev page - plain background for peek */}
      <View key="prev" style={styles.page}>
        <View style={{ flex: 1, backgroundColor: '#FFF8F0' }} />
      </View>

      {/* Current page */}
      <View key="curr" style={styles.page}>
        {renderPage(isJuzMode ? undefined : pages.curr, isJuzMode ? pages.curr : undefined)}
      </View>

      {/* Next page - plain background for peek */}
      <View key="next" style={styles.page}>
        <View style={{ flex: 1, backgroundColor: '#FFF8F0' }} />
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});

