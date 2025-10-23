import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getSettings,
  updateSettings,
} from '@/services/profile';
import { getCurrentStreak } from '@/services/checkins';
import { getReadingStats } from '@/services/reading';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { InitialAvatar } from '@/components/profile/InitialAvatar';
import { DailyGoalSetting } from '@/components/settings/DailyGoalSetting';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get real progress data
  const { data: streakData, refetch: refetchStreak } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 0, // Always fresh
    refetchOnWindowFocus: true,
  });

  // Monthly stats (user-specific from reading sessions)
  const { data: readingStats } = useQuery({
    queryKey: ['reading', 'stats', 'profile-month'],
    queryFn: () => {
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');
      return getReadingStats(start, end);
    },
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
  });

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Mutation for updating daily goal
  const updateGoalMutation = useMutation({
    mutationFn: (newGoal: number) => updateSettings({ daily_goal_ayat: newGoal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['userSettings'] });
      Alert.alert('✅ Berhasil', 'Target harian telah diperbarui');
    },
    onError: (error: any) => {
      Alert.alert('❌ Gagal', error.message || 'Gagal memperbarui target harian');
    },
  });

  // Real-time updates for streak and reading data
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log('[ProfileScreen] Setting up real-time sync for user:', user.id);

      const channel = supabase
        .channel('profile-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checkins',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('[ProfileScreen] Checkins updated, invalidating queries');
            qc.invalidateQueries({ queryKey: ['checkin'] });
            qc.invalidateQueries({ queryKey: ['streak'] });
            qc.invalidateQueries({ queryKey: ['reading'] });
            // Force refetch streak data
            refetchStreak();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reading_sessions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('[ProfileScreen] Reading sessions updated, invalidating queries');
            qc.invalidateQueries({ queryKey: ['reading'] });
          }
        )
        .subscribe();

      return () => {
        console.log('[ProfileScreen] Cleaning up real-time subscriptions');
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [qc]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      console.log('[ProfileScreen] Name updated successfully:', data);
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditingName(false);
      Alert.alert('Berhasil', 'Nama berhasil diperbarui');
    },
    onError: (error: any) => {
      console.error('[ProfileScreen] Name update error:', error);
      console.error('[ProfileScreen] Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
        hint: error?.hint || 'No hint available',
        details: error?.details || 'No details available',
      });
      Alert.alert('Gagal', `Tidak bisa menyimpan nama: ${error?.message || 'Unknown error'}`);
    },
  });

  const handleAvatarPress = () => {
    Alert.alert(
      'Avatar',
      'Avatar akan otomatis berubah sesuai dengan nama Anda. Ubah nama untuk mengubah avatar.',
      [{ text: 'Mengerti', style: 'default' }]
    );
  };

  const handleEditName = () => {
    setTempName(profile?.display_name || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmedName = tempName.trim();
    if (!trimmedName) {
      Alert.alert('Nama Kosong', 'Nama tidak boleh kosong');
      return;
    }

    // Check authentication first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[ProfileScreen] Auth check failed:', authError);
      Alert.alert('Error', 'Anda belum login. Silakan login ulang.');
      return;
    }

    console.log('[ProfileScreen] User authenticated:', user.id);
    console.log('[ProfileScreen] Saving name:', trimmedName);
    updateMutation.mutate({ display_name: trimmedName });
  };

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun Anda?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <InitialAvatar name={profile?.display_name || null} onPress={handleAvatarPress} size={80} />
      </View>

      {/* Name */}
      <View style={styles.nameSection}>
        {editingName ? (
          <View style={styles.nameEdit}>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              placeholder="Nama Anda"
              style={styles.nameInput}
              autoFocus
            />
            <View style={styles.nameButtons}>
              <Pressable onPress={() => setEditingName(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>
              <Pressable onPress={handleSaveName} style={styles.saveButton}>
                <Text style={styles.saveText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={handleEditName} style={styles.nameDisplay}>
            <Text style={styles.nameText}>{profile?.display_name || 'Nama Belum Diisi'}</Text>
            <Text style={styles.editHint}>✏️ Ketuk untuk edit</Text>
          </Pressable>
        )}
      </View>

      {/* Quick Stats - Connected to real data */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ringkasan Aktivitas</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakData?.current || 0}</Text>
            <Text style={styles.statLabel}>Hari Berturut</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{readingStats?.totalAyat || 0}</Text>
            <Text style={styles.statLabel}>Total Ayat (bulan ini)</Text>
          </View>
        </View>
        <Text style={styles.statsHint}>💡 Statistik lengkap ada di tab Progress</Text>
      </View>

      {/* Daily Goal Setting */}
      {userSettings && (
        <DailyGoalSetting
          currentGoal={userSettings.daily_goal_ayat}
          onGoalChange={(newGoal) => updateGoalMutation.mutate(newGoal)}
          isLoading={updateGoalMutation.isPending}
        />
      )}

      {/* Stats button */}
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

      {/* Settings button */}
      <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsButtonText}>⚙️ Pengaturan</Text>
      </Pressable>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
      </Pressable>

      <Text style={styles.versionText}>Miqra v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  avatarSection: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  nameSection: { marginBottom: 24 },
  nameDisplay: { alignItems: 'center' },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  editHint: { fontSize: 13, color: colors.primary },
  nameEdit: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
    marginBottom: 12,
  },
  nameButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  statsSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  statsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  settingsButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsButtonText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
});
