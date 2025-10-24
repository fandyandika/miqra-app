import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { previewHasanatForRange } from '@/services/hasanat';
import { colors } from '@/theme/colors';

interface HasanatPreviewCardProps {
  onPreview?: (preview: { letterCount: number; hasanat: number }) => void;
}

export function HasanatPreviewCard({ onPreview }: HasanatPreviewCardProps) {
  const [surah, setSurah] = useState(1);
  const [ayatStart, setAyatStart] = useState(1);
  const [ayatEnd, setAyatEnd] = useState(3);
  const [preview, setPreview] = useState({ letterCount: 0, hasanat: 0 });

  useEffect(() => {
    const result = previewHasanatForRange(surah, ayatStart, ayatEnd);
    setPreview(result);
    onPreview?.(result);
  }, [surah, ayatStart, ayatEnd, onPreview]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌟 Preview Hasanat</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Surah</Text>
          <TextInput
            style={styles.input}
            value={surah.toString()}
            onChangeText={(text) => setSurah(parseInt(text) || 1)}
            keyboardType="numeric"
            placeholder="1"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ayat Start</Text>
          <TextInput
            style={styles.input}
            value={ayatStart.toString()}
            onChangeText={(text) => setAyatStart(parseInt(text) || 1)}
            keyboardType="numeric"
            placeholder="1"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ayat End</Text>
          <TextInput
            style={styles.input}
            value={ayatEnd.toString()}
            onChangeText={(text) => setAyatEnd(parseInt(text) || 1)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>
      </View>

      <View style={styles.previewContainer}>
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Huruf</Text>
          <Text style={styles.previewValue}>{preview.letterCount.toLocaleString('id-ID')}</Text>
        </View>

        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Hasanat</Text>
          <Text style={styles.previewValue}>{preview.hasanat.toLocaleString('id-ID')}</Text>
        </View>
      </View>

      <Text style={styles.footer}>💫 Setiap huruf = 10 hasanat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.primary,
  },
  previewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
