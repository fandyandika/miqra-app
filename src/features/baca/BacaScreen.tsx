import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useContinueReading } from './hooks/useContinueReading';
import { ContinueBanner } from './components/ContinueBanner';
import { ActionButton } from './components/ActionButton';
import TodaySummary from './components/TodaySummary';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/theme/colors';

export default function BacaScreen() {
  const { user } = useAuth();
  const { bookmark } = useContinueReading(user?.id);
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Baca Al-Qur'an Hari Ini</Text>

      {bookmark && <ContinueBanner bookmark={bookmark} />}

      <ActionButton
        icon="📖"
        title="Baca Langsung di Aplikasi"
        subtitle="Mulai dari surah terakhir atau pilih surah baru"
        onPress={() => navigation.navigate('Reader')}
        color={colors.primary}
      />

      <ActionButton
        icon="🧭"
        title="Pilih Surah"
        subtitle="Jelajahi 114 surah"
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

      <TodaySummary totalAyat={52} totalHasanat={420} />
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
    marginTop: 24,
    marginBottom: 12,
  },
});
