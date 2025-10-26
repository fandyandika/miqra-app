import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { useNavigation } from '@react-navigation/native';

export function ContinueBanner({ bookmark }: { bookmark: any }) {
  const navigation = useNavigation<any>();

  if (!bookmark) return null;

  return (
    <Pressable
      onPress={() =>
        navigation.navigate('Reader', {
          surahNumber: bookmark.surahNumber,
          ayatNumber: bookmark.ayatNumber,
        })
      }
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Lanjutkan Bacaan</Text>
        <Text style={styles.subtitle}>
          {bookmark.surahName} — Ayat {bookmark.ayatNumber}
        </Text>
      </View>
      <Text style={styles.icon}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontWeight: '700', color: colors.primary, fontSize: 16 },
  subtitle: { color: '#4B5563', fontSize: 14, marginTop: 2 },
  icon: { fontSize: 20, color: colors.primary },
});
