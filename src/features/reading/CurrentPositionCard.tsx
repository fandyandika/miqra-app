import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { SURAH_META } from '@/data/quran_meta';

type Props = {
  surahNumber: number;
  ayahNumber: number;
  onContinuePress?: () => void;
  isNextUnread?: boolean;
};

export function CurrentPositionCard({
  surahNumber,
  ayahNumber,
  onContinuePress,
  isNextUnread = false,
}: Props) {
  const surah = SURAH_META.find((s) => s.number === surahNumber);

  return (
    <View
      style={st.container}
      accessible
      accessibilityLabel={`${isNextUnread ? 'Posisi selanjutnya' : 'Posisi terakhir'}: Surah ${surahNumber} ${surah?.name || 'Tidak diketahui'}, ayat ${ayahNumber}.`}
    >
      <View style={st.header}>
        <Text style={st.label}>{isNextUnread ? 'Posisi Selanjutnya' : 'Posisi Terakhir'}</Text>
        <Text style={{ fontSize: 20 }}>{isNextUnread ? '🎯' : '📖'}</Text>
      </View>
      <Text style={st.title}>
        {surahNumber}. {surah?.name || '-'}
      </Text>
      <Text style={st.sub}>
        Ayat {ayahNumber} dari {surah?.ayatCount ?? 0}
      </Text>
      {isNextUnread && <Text style={st.hint}>💡 Ayat yang belum dibaca</Text>}
      {onContinuePress && (
        <Pressable
          style={st.cta}
          onPress={onContinuePress}
          accessibilityLabel={`Lanjutkan membaca dari ${isNextUnread ? 'posisi selanjutnya' : 'posisi terakhir'}`}
        >
          <Text style={st.ctaText}>Lanjutkan Membaca →</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: colors.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: (colors as any).text?.primary ?? '#111827',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: colors.neutral,
    marginBottom: 12,
  },
  cta: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
