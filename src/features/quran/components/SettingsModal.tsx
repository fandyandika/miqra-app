import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TAJWEED: 'quran_show_tajweed',
  DARK_MODE: 'quran_dark_mode',
  TRANSLITERATION: 'quran_show_transliteration',
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  showTajweed: boolean;
  setShowTajweed: (value: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  showTransliteration: boolean;
  setShowTransliteration: (value: boolean) => void;
  showTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
}

export default function SettingsModal({
  visible,
  onClose,
  showTajweed,
  setShowTajweed,
  isDarkMode,
  setIsDarkMode,
  showTransliteration,
  setShowTransliteration,
  showTranslation,
  setShowTranslation,
}: SettingsModalProps) {
  const handleToggleTajweed = async (value: boolean) => {
    setShowTajweed(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TAJWEED, JSON.stringify(value));
      console.log('Tajweed toggled to:', value);
    } catch (e) {
      console.error('Failed to save tajweed preference:', e);
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(value));
      console.log('Dark mode toggled to:', value);
    } catch (e) {
      console.error('Failed to save dark mode preference:', e);
    }
  };

  const handleToggleTransliteration = async (value: boolean) => {
    setShowTransliteration(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSLITERATION, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save transliteration preference:', e);
    }
  };

  const handleToggleTranslation = async (value: boolean) => {
    setShowTranslation(value);
    try {
      await AsyncStorage.setItem('quran_show_translation', JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save translation preference:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pengaturan</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color="#2D3436" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Tajwid</Text>
                <Text style={styles.settingDesc}>Tampilkan warna tajwid pada teks Arab</Text>
              </View>
              <Switch value={showTajweed} onValueChange={handleToggleTajweed} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Mode Gelap</Text>
                <Text style={styles.settingDesc}>Tema gelap untuk membaca</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={handleToggleDarkMode} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Transliterasi Latin</Text>
                <Text style={styles.settingDesc}>Tampilkan teks Latin di bawah Arab</Text>
              </View>
              <Switch value={showTransliteration} onValueChange={handleToggleTransliteration} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Terjemahan</Text>
                <Text style={styles.settingDesc}>Tampilkan terjemahan Indonesia</Text>
              </View>
              <Switch value={showTranslation} onValueChange={handleToggleTranslation} />
            </View>
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  content: {
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#7F8C8D',
  },
});

