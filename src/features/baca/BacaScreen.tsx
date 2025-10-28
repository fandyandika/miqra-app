import React from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useContinueReading } from './hooks/useContinueReading';
import { useTodayStats } from './hooks/useTodayStats';
import { ContinueBanner } from './components/ContinueBanner';
import { ActionButton } from './components/ActionButton';
import TodaySummary from './components/TodaySummary';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/theme/colors';

export default function BacaScreen() {
  const { user } = useAuth();
  const { bookmark } = useContinueReading(user?.id);
  const { data: todayStats, isLoading } = useTodayStats();
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Baca Al-Qur'an Hari Ini</Text>

      {bookmark && <ContinueBanner bookmark={bookmark} />}

      <ActionButton
        icon="📖"
        title="Baca per Ayat (Focus)"
        subtitle="Baca per ayat dengan navigasi mudah"
        onPress={() => {
          const startSurah = bookmark?.surah_number || 1;
          const startAyat = bookmark?.ayat_number || 1;
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
});
