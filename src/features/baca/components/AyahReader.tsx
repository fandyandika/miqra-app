import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useQuranReader } from '@/features/quran/useQuranReader';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface AyahReaderProps {
  initialSurah?: number;
  initialAyat?: number;
  onClose?: () => void;
}

export default function AyahReader({
  initialSurah = 1,
  initialAyat = 1,
  onClose,
}: AyahReaderProps) {
  const navigation = useNavigation<any>();
  const [currentSurah, setCurrentSurah] = useState(initialSurah);
  const [currentAyat, setCurrentAyat] = useState(initialAyat);

  const { surah, loading } = useQuranReader(currentSurah, 'id');

  const getArabicNumber = (num: number): string => {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num
      .toString()
      .split('')
      .map((digit) => arabic[parseInt(digit)])
      .join('');
  };

  const currentAyahData = surah?.ayat?.find((a) => a.number === currentAyat);

  const handleNext = () => {
    if (!surah?.ayat_count) return;

    if (currentAyat < surah.ayat_count) {
      setCurrentAyat(currentAyat + 1);
    } else if (currentSurah < 114) {
      setCurrentSurah(currentSurah + 1);
      setCurrentAyat(1);
    }
  };

  const handlePrevious = () => {
    if (currentAyat > 1) {
      setCurrentAyat(currentAyat - 1);
    } else if (currentSurah > 1) {
      setCurrentSurah(currentSurah - 1);
      // Set ayat ke ayat terakhir surah sebelumnya
      // TODO: Get previous surah's ayat count
      setCurrentAyat(1);
    }
  };

  if (loading || !surah || !currentAyahData) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose || (() => navigation.goBack())} style={styles.iconButton}>
          <Feather name="arrow-left" size={24} color="#2D3436" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{surah.name}</Text>
          <Text style={styles.headerSubtitle}>
            Ayat {currentAyat} / {surah.ayat_count}
          </Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currentAyat}</Text>
        </View>

        <Text style={styles.arabic}>
          {currentAyahData.text}{' '}
          <Text style={styles.ayahNumberInline}>{getArabicNumber(currentAyat)}</Text>
        </Text>

        <Text style={styles.translation}>{currentAyahData.translation}</Text>

        <View style={styles.buttons}>
          <Pressable
            style={[
              styles.button,
              currentAyat === 1 && currentSurah === 1 && styles.buttonDisabled,
            ]}
            disabled={currentAyat === 1 && currentSurah === 1}
            onPress={handlePrevious}
          >
            <Feather name="arrow-left" size={20} color="#2D3436" />
            <Text style={styles.buttonText}>Sebelumnya</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              currentAyat === surah.ayat_count && currentSurah === 114 && styles.buttonDisabled,
            ]}
            disabled={currentAyat === surah.ayat_count && currentSurah === 114}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>Selanjutnya</Text>
            <Feather name="arrow-right" size={20} color="#2D3436" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF8F0',
  },
  iconButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    color: '#2D3436',
    fontWeight: '500',
    fontSize: 16,
  },
  headerSubtitle: {
    color: '#636E72',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d3436',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  arabic: {
    fontSize: 32,
    lineHeight: 64,
    textAlign: 'center',
    fontFamily: 'LPMQ-Isep-Misbah',
    color: '#2D3436',
    marginBottom: 24,
  },
  ayahNumberInline: {
    fontSize: 28,
    fontFamily: 'LPMQ-Isep-Misbah',
    color: '#4B5563',
    fontWeight: '600',
  },
  translation: {
    fontSize: 16,
    color: '#795c40',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: '#2D3436',
    fontSize: 16,
    fontWeight: '600',
  },
});
