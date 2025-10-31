import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '@/theme/colors';

interface JumpToSurahModalProps {
  visible: boolean;
  onClose: () => void;
  onJump: (surah: number, ayat: number) => void;
  currentSurah?: number;
  surahList: { number: number; name: string; ayat_count: number }[];
}

export default function JumpToSurahModal({
  visible,
  onClose,
  onJump,
  currentSurah = 1,
  surahList,
}: JumpToSurahModalProps) {
  const [selectedSurah, setSelectedSurah] = useState(currentSurah);
  const [ayatInput, setAyatInput] = useState('1');
  const [maxAyat, setMaxAyat] = useState(7);

  useEffect(() => {
    const surah = surahList.find((s) => s.number === selectedSurah);
    if (surah) {
      setMaxAyat(surah.ayat_count);
      if (parseInt(ayatInput) > surah.ayat_count) {
        setAyatInput('1');
      }
    }
  }, [selectedSurah, surahList]);

  useEffect(() => {
    setSelectedSurah(currentSurah);
  }, [currentSurah, visible]);

  const handleJump = () => {
    const ayatNum = parseInt(ayatInput) || 1;
    if (ayatNum < 1) {
      setAyatInput('1');
      return;
    }
    if (ayatNum > maxAyat) {
      setAyatInput(maxAyat.toString());
      return;
    }
    onJump(selectedSurah, ayatNum);
    onClose();
  };

  const handleCancel = () => {
    setSelectedSurah(currentSurah);
    setAyatInput('1');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Pergi ke Surah</Text>
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSurah}
              onValueChange={setSelectedSurah}
              style={styles.picker}
            >
              {surahList.map((surah) => (
                <Picker.Item
                  key={surah.number}
                  label={`${surah.number}. ${surah.name}`}
                  value={surah.number}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Masukkan nomor ayat antara 1-{maxAyat}</Text>
            <TextInput
              style={styles.input}
              value={ayatInput}
              onChangeText={setAyatInput}
              keyboardType="number-pad"
              placeholder={`1-${maxAyat}`}
              maxLength={maxAyat.toString().length}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.okButton]} onPress={handleJump}>
              <Text style={styles.okButtonText}>OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeButton: { fontSize: 24, color: '#9CA3AF', fontWeight: '300' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  okButton: { backgroundColor: colors.primary },
  okButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
