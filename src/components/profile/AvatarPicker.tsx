import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';

type AvatarPickerProps = {
  currentUrl: string | null;
  onUpload: (file: Blob) => Promise<string>;
  size?: number;
};

export function AvatarPicker({ currentUrl, onUpload, size = 100 }: AvatarPickerProps) {
  const [loading, setLoading] = useState(false);
  const [tempUrl, setTempUrl] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Kami butuh akses ke galeri Anda untuk mengunggah foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const url = await onUpload(blob);
        setTempUrl(url);
        AccessibilityInfo.announceForAccessibility?.('Foto profil diperbarui');
      } catch (error: any) {
        Alert.alert('Gagal', error.message || 'Tidak bisa mengunggah foto');
      } finally {
        setLoading(false);
      }
    }
  };

  const displayUrl = tempUrl || currentUrl;

  return (
    <Pressable
      onPress={pickImage}
      accessibilityRole="button"
      accessibilityLabel="Ubah foto profil"
      style={[styles.container, { width: size, height: size }]}
    >
      {displayUrl ? (
        <Image source={{ uri: displayUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📷</Text>
        </View>
      )}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      <View style={styles.editBadge}>
        <Text style={styles.editText}>✏️</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 999, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 32 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editText: { fontSize: 14 },
});
