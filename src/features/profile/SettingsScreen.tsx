import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/services/profile';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { colors } from '@/theme/colors';

export default function SettingsScreen() {
  const qc = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const handleToggle =
    (key: keyof NonNullable<Awaited<ReturnType<typeof getSettings>>>) =>
    (value: boolean) => {
      updateMutation.mutate({ [key]: value } as any);
    };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.dim}>Memuat pengaturan…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Gagal memuat pengaturan.</Text>
        <Text style={styles.dim}>Coba buka ulang tab ini.</Text>
      </View>
    );
  }

  // ✅ Fallback aman: walau settings null, UI tetap tampil
  const s = settings ?? {
    user_id: 'local-fallback',
    hasanat_visible: false,
    share_with_family: false,
    join_leaderboard: false,
    daily_reminder_enabled: true,
    reminder_time: '06:00:00',
    streak_warning_enabled: true,
    family_nudge_enabled: true,
    milestone_celebration_enabled: true,
    daily_goal_ayat: 5,
    theme: 'light' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Privasi pahala */}
      <SettingSection title='Privasi Pahala'>
        <SettingToggle
          label='Tampilkan Estimasi Pahala'
          description='Tunjukkan perkiraan hasanat di dashboard'
          value={s.hasanat_visible}
          onChange={handleToggle('hasanat_visible')}
        />
        <SettingToggle
          label='Bagikan ke Keluarga'
          description='Anggota keluarga dapat melihat pahala Anda'
          value={s.share_with_family}
          onChange={handleToggle('share_with_family')}
          disabled={!s.hasanat_visible}
        />
        <SettingToggle
          label='Ikut Leaderboard Global'
          description='Muncul di peringkat mingguan (anonim)'
          value={s.join_leaderboard}
          onChange={handleToggle('join_leaderboard')}
        />
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Wallahu a'lam. Angka hasanat hanyalah perkiraan berdasarkan
            hadits shahih.
          </Text>
        </View>
      </SettingSection>

      {/* Notifikasi */}
      <SettingSection title='Notifikasi'>
        <SettingToggle
          label='Pengingat Harian'
          description={`Waktu saat ini: ${s.reminder_time?.slice(0, 5)}`}
          value={s.daily_reminder_enabled}
          onChange={handleToggle('daily_reminder_enabled')}
        />
        <SettingToggle
          label='Peringatan Streak'
          description='Ingatkan jika belum membaca hari ini'
          value={s.streak_warning_enabled}
          onChange={handleToggle('streak_warning_enabled')}
        />
        <SettingToggle
          label='Aktivitas Keluarga'
          description='Kabar saat anggota keluarga membaca'
          value={s.family_nudge_enabled}
          onChange={handleToggle('family_nudge_enabled')}
        />
        <SettingToggle
          label='Perayaan Milestone'
          description='Notifikasi untuk pencapaian khusus'
          value={s.milestone_celebration_enabled}
          onChange={handleToggle('milestone_celebration_enabled')}
        />
      </SettingSection>

      {/* Preferensi */}
      <SettingSection title='Preferensi Bacaan'>
        <View style={styles.card}>
          <Text style={styles.label}>Target Harian</Text>
          <Text style={styles.value}>{s.daily_goal_ayat} ayat</Text>
          <Text style={styles.dim}>Fitur ubah target segera hadir</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tema</Text>
          <Text style={styles.value}>
            {s.theme === 'light'
              ? '☀️ Terang'
              : s.theme === 'dark'
                ? '🌙 Gelap'
                : '🔄 Auto'}
          </Text>
          <Text style={styles.dim}>Mode gelap segera hadir</Text>
        </View>
      </SettingSection>

      {/* Akun */}
      <SettingSection title='Akun'>
        <Pressable
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert(
              'Hapus Akun',
              'Penghapusan akun dinonaktifkan di build ini.',
              [{ text: 'OK' }]
            )
          }
        >
          <Text style={styles.deleteTxt}>🗑️ Hapus Akun</Text>
        </Pressable>
        <Text style={[styles.dim, { textAlign: 'center', marginTop: 6 }]}>
          ⚠️ Tindakan ini permanen (akan diaktifkan menjelang rilis).
        </Text>
      </SettingSection>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  err: { color: '#DC2626', fontSize: 14, marginTop: 8 },
  dim: { color: '#6B7280', fontSize: 13 },
  tipBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  tipText: { color: colors.primary, fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteTxt: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});
