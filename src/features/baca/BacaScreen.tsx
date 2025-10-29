import React from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useContinueReading } from './hooks/useContinueReading';
import { useTodayStats } from './hooks/useTodayStats';
import { ContinueBanner } from './components/ContinueBanner';
import { ActionButton } from './components/ActionButton';
import TodaySummary from './components/TodaySummary';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/theme/colors';
import { useQuery } from '@tanstack/react-query';
import { getBookmark } from '@/services/quran/bookmarkService';

export default function BacaScreen() {
  const { user } = useAuth();
  const { bookmark: oldBookmark } = useContinueReading(user?.id);
  const { data: todayStats, isLoading } = useTodayStats();
  const navigation = useNavigation<any>();

  // Use new bookmark service
  const { data: bookmark } = useQuery({
    queryKey: ['bookmark'],
    queryFn: getBookmark,
    enabled: !!user,
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Baca Al-Qur'an Hari Ini</Text>

      {bookmark && (
        <Pressable
          style={styles.continueCard}
          onPress={() => {
            navigation.navigate('Reader', {
              surahNumber: bookmark.surah,
              ayahNumber: bookmark.ayat,
            });
          }}
        >
          <View style={styles.continueIcon}>
            <Text style={styles.continueEmoji}>📖</Text>
          </View>
          <View style={styles.continueContent}>
            <Text style={styles.continueLabel}>Lanjutkan Bacaan</Text>
            <Text style={styles.continueText}>
              Surah {bookmark.surah} ayat {bookmark.ayat}
            </Text>
            {bookmark.juz && <Text style={styles.continueMeta}>Juz {bookmark.juz}</Text>}
          </View>
          <Text style={styles.continueArrow}>→</Text>
        </Pressable>
      )}

      <ActionButton
        icon="📖"
        title="Baca per Ayat (Focus)"
        subtitle="Baca per ayat dengan navigasi mudah"
        onPress={() => {
          const startSurah = bookmark?.surah || 1;
          const startAyat = bookmark?.ayat || 1;
          navigation.navigate('AyahReader', { surahNumber: startSurah, ayatNumber: startAyat });
        }}
        color={colors.primary}
      />

      <ActionButton
        icon="🧭"
        title="Baca Qur'an"
        subtitle="Surah • Juz • Bookmark"
        onPress={() => navigation.navigate('SurahSelector')}
        color={colors.secondary}
      />

      <ActionButton
        icon="📝"
        title="Catat Bacaan Manual"
        subtitle="Gunakan jika membaca dari mushaf fisik"
        onPress={() => navigation.navigate('LogReading')}
        color={colors.accent}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : (
        <TodaySummary
          totalAyat={todayStats?.totalAyat || 0}
          totalHasanat={todayStats?.totalHasanat || 0}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginHorizontal: 16,
    marginTop: 50,
    marginBottom: 12,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  continueEmoji: {
    fontSize: 24,
  },
  continueContent: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  continueMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  continueArrow: {
    fontSize: 24,
    color: colors.primary,
  },
});
