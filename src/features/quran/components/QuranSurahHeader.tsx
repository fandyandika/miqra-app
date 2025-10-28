import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QuranSurahHeaderProps {
  revelation: 'Mekah' | 'Madinah';
  surahNumber: number;
  surahName: string;
  meaning?: string;
  totalAyahs?: number;
  surahNameAr?: string;
}

export default function QuranSurahHeader({
  revelation,
  surahNumber,
  surahName,
  meaning,
  totalAyahs,
  surahNameAr,
}: QuranSurahHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Islamic Ornament Left */}
      <View style={styles.ornamentContainer}>
        <View style={styles.ornament} />
      </View>

      <View style={styles.content}>
        {/* Left Badge - Revelation Place */}
        <View style={[styles.badge, styles.revelationBadge]}>
          <Text style={styles.badgeText}>{revelation}</Text>
        </View>

        {/* Center Section - Surah Name */}
        <View style={styles.centerSection}>
          <Text style={styles.surahNumberName}>
            {surahNumber}. {surahName}
          </Text>
          {meaning && <Text style={styles.meaning}>({meaning})</Text>}
        </View>

        {/* Right Badge - Total Ayat */}
        {totalAyahs && (
          <View style={[styles.badge, styles.ayatBadge]}>
            <Text style={styles.badgeText}>{totalAyahs} Ayat</Text>
          </View>
        )}
      </View>

      {/* Islamic Ornament Right */}
      <View style={styles.ornamentContainer}>
        <View style={styles.ornament} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ornamentContainer: {
    width: 20,
    alignItems: 'center',
  },
  ornament: {
    width: 6,
    height: 60,
    backgroundColor: '#F2D5B5',
    opacity: 0.4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8D5C4',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8D5C4',
    borderWidth: 1,
    borderColor: '#F2D5B5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B6F47',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  surahNumberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4E3A',
    textAlign: 'center',
    marginBottom: 2,
  },
  meaning: {
    fontSize: 11,
    color: '#8B6F47',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  revelationBadge: {},
  ayatBadge: {},
});
