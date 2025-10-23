import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { SettingSection } from '@/components/settings/SettingSection';
import { colors } from '@/theme/colors';
import { uploadAvatar } from '@/services/profile';

export default function ProfileSettingsExample() {
  const [profile, setProfile] = useState({
    avatar_url: null as string | null,
    display_name: 'User Name',
  });

  const [settings, setSettings] = useState({
    hasanat_visible: false,
    share_with_family: true,
    join_leaderboard: false,
    daily_reminder_enabled: true,
    streak_warning_enabled: true,
    family_nudge_enabled: true,
    milestone_celebration_enabled: true,
  });

  const handleAvatarUpload = async (file: Blob): Promise<string> => {
    try {
      const url = await uploadAvatar(file);
      setProfile(prev => ({ ...prev, avatar_url: url }));
      return url;
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Tidak bisa mengunggah foto');
      throw error;
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profil & Pengaturan</Text>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Profil</Text>

        <View style={styles.avatarContainer}>
          <AvatarPicker
            currentUrl={profile.avatar_url}
            onUpload={handleAvatarUpload}
            size={120}
          />
          <Text style={styles.profileName}>{profile.display_name}</Text>
        </View>
      </View>

      {/* Privacy Settings */}
      <SettingSection title='Privasi'>
        <SettingToggle
          label='Tampilkan Estimasi Pahala'
          description='Bagikan estimasi pahala dengan keluarga'
          value={settings.hasanat_visible}
          onChange={value => updateSetting('hasanat_visible', value)}
        />

        <SettingToggle
          label='Bagikan dengan Keluarga'
          description='Izinkan keluarga melihat progres Anda'
          value={settings.share_with_family}
          onChange={value => updateSetting('share_with_family', value)}
        />

        <SettingToggle
          label='Ikut Leaderboard'
          description='Tampilkan nama di papan peringkat'
          value={settings.join_leaderboard}
          onChange={value => updateSetting('join_leaderboard', value)}
        />
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title='Notifikasi'>
        <SettingToggle
          label='Pengingat Harian'
          description="Ingatkan untuk membaca Al-Qur'an setiap hari"
          value={settings.daily_reminder_enabled}
          onChange={value => updateSetting('daily_reminder_enabled', value)}
        />

        <SettingToggle
          label='Peringatan Streak'
          description='Beritahu jika streak akan terputus'
          value={settings.streak_warning_enabled}
          onChange={value => updateSetting('streak_warning_enabled', value)}
        />

        <SettingToggle
          label='Dorongan Keluarga'
          description='Terima dorongan dari anggota keluarga'
          value={settings.family_nudge_enabled}
          onChange={value => updateSetting('family_nudge_enabled', value)}
        />

        <SettingToggle
          label='Perayaan Pencapaian'
          description='Rayakan milestone dan pencapaian'
          value={settings.milestone_celebration_enabled}
          onChange={value =>
            updateSetting('milestone_celebration_enabled', value)
          }
        />
      </SettingSection>

      {/* Debug Info */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          Avatar URL: {profile.avatar_url || 'None'}
        </Text>
        <Text style={styles.debugText}>
          Settings: {JSON.stringify(settings, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  profileSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  debugSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
