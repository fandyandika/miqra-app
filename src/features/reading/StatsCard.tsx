import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { SURAH_META } from '@/data/quran_meta';

type StatsCardProps = {
  totalAyat: number;
  daysRead: number;
  avgPerDay: number;
  period: 'day' | 'week' | 'month' | 'year';
};

export function StatsCard({ totalAyat, daysRead, avgPerDay, period }: StatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.value}>{totalAyat.toLocaleString('id-ID')}</Text>
          <Text style={styles.label}>Total Ayat</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{daysRead}</Text>
          <Text style={styles.label}>
            {period === 'day' ? 'Hari Ini' : 
             period === 'week' ? 'Hari Aktif' : 
             period === 'month' ? 'Hari Aktif' : 
             'Hari Aktif'}
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{Math.round(avgPerDay)}</Text>
          <Text style={styles.label}>
            {period === 'day' ? 'Ayat/Hari' : 
             period === 'week' ? 'Rata-rata/Hari' : 
             period === 'month' ? 'Rata-rata/Hari' : 
             'Rata-rata/Hari'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  item: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
});
