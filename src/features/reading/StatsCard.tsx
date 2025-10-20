import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { SURAH_META } from '@/data/quran_meta';

type StatsCardProps = {
  totalAyat: number;
  daysRead: number;
  avgPerDay: number;
  mostReadSurah: number | null;
};

export function StatsCard({ totalAyat, daysRead, avgPerDay, mostReadSurah }: StatsCardProps) {
  const name = mostReadSurah ? SURAH_META.find(s => s.number === mostReadSurah)?.name : undefined;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Ringkasan bulan ini. Total ${totalAyat} ayat, ${daysRead} hari membaca, rata-rata ${avgPerDay} ayat per hari${name ? `, surah terbanyak ${name}` : ''}.`}
    >
      <Text style={styles.title}>Ringkasan Bulan Ini</Text>

      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.value}>{totalAyat.toLocaleString('id-ID')}</Text>
          <Text style={styles.label}>Total Ayat</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{daysRead}</Text>
          <Text style={styles.label}>Hari Membaca</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{avgPerDay}</Text>
          <Text style={styles.label}>Rata-rata/Hari</Text>
        </View>
        {name && (
          <View style={[styles.item, styles.full]}>
            <Text style={styles.value}>{name}</Text>
            <Text style={styles.label}>Surah Terbanyak</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text?.primary ?? '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  full: { minWidth: '100%' },
  value: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  label: { fontSize: 12, color: colors.neutral, textAlign: 'center' },
});


