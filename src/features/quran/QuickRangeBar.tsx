import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const presets = [
  { label: '1', size: 1 },
  { label: '3', size: 3 },
  { label: '5', size: 5 },
  { label: '10', size: 10 },
  { label: 'Akhir', size: Infinity },
];

export default function QuickRangeBar({
  currentAyat,
  totalAyat,
  onPickRange,
}: {
  currentAyat: number;
  totalAyat: number;
  onPickRange: (start: number, end: number) => void;
}) {
  const pick = (sz: number) => {
    const start = currentAyat;
    const end = sz === Infinity ? totalAyat : Math.min(totalAyat, start + sz - 1);
    onPickRange(start, end);
  };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Rentang cepat:</Text>
      {presets.map((p) => (
        <Pressable key={p.label} style={styles.chip} onPress={() => pick(p.size)}>
          <Text style={styles.chipTxt}>{p.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  label: { fontSize: 12, color: '#6B7280', marginRight: 4 },
  chip: {
    backgroundColor: colors.primary + '20',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipTxt: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
