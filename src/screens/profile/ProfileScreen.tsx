import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '@/components/ui/Header';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <View className='flex-1 bg-background px-5 pt-14'>
      <Header title='Profil' subtitle='Nama, zona waktu, akun' />

      <View style={styles.content}>
        <Text className='text-text-secondary mb-6'>
          Kelola profil dan lihat statistik lengkap bacaan Al-Qur'an Anda.
        </Text>

        <Pressable
          style={styles.statsButton}
          onPress={() => {
            console.log('📊 Navigating to Stats from Profile');
            navigation.navigate('Stats');
          }}
        >
          <Text style={styles.statsButtonIcon}>📊</Text>
          <Text style={styles.statsButtonText}>Lihat Statistik Lengkap</Text>
          <Text style={styles.statsButtonArrow}>→</Text>
        </Pressable>

        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Fitur Segera Hadir</Text>
          <Text style={styles.comingSoonText}>
            • Edit nama dan foto profil{'\n'}• Atur waktu reminder{'\n'}• Kelola
            notifikasi{'\n'}• Logout dan hapus akun
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  statsButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statsButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  statsButtonArrow: {
    fontSize: 20,
    color: colors.primary,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
