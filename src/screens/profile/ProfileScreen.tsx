import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { colors } from '@/theme/colors';
import { useAuthSession } from '@/hooks/useAuth';
import { getCurrentStreak } from '@/services/checkins';
import { getUserProfile, getSettings } from '@/services/profile';
import { getUserTotalHasanat } from '@/services/hasanat';
import { HasanatCard } from '@/components/hasanat/HasanatCard';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { session, signOut } = useAuthSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  // Get user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    staleTime: 300_000,
  });

  // Get user settings for daily goal
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 300_000,
  });

  // Get hasanat data (only if hasanat_visible is true)
  const { data: hasanatData } = useQuery({
    queryKey: ['hasanat', 'total'],
    queryFn: getUserTotalHasanat,
    enabled: settings?.hasanat_visible === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current streak for quick stats - with real-time updates
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 10_000, // 10 seconds for faster updates
    refetchOnWindowFocus: true,
  });

  // REAL-TIME SYNC for Profile Screen
  useEffect(() => {
    if (!user) return;

    console.log('[ProfileScreen] Setting up real-time sync for user:', user.id);

    // Subscribe to checkins changes for streak updates
    const checkinsChannel = supabase
      .channel('profile-checkins')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ProfileScreen] 🔥 Checkins changed, updating streak:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
        }
      )
      .subscribe();

    // Subscribe to reading sessions for progress updates
    const sessionsChannel = supabase
      .channel('profile-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ProfileScreen] 📚 Reading sessions changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.invalidateQueries({ queryKey: ['reading'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[ProfileScreen] Cleaning up real-time subscriptions');
      checkinsChannel.unsubscribe();
      sessionsChannel.unsubscribe();
    };
  }, [user, queryClient]);

  const currentStreak = streakData?.current || 0;
  const longestStreak = streakData?.longest || 0;
  const dailyGoal = settings?.daily_goal_ayat || 5;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewDetailedStats = () => {
    navigation.navigate('Stats');
  };

  const handleEditSettings = () => {
    navigation.navigate('Settings');
  };

  if (profileLoading || streakLoading || settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header title="Profil" subtitle="Kelola akun dan lihat ringkasan" />

      <View style={styles.content}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{profile?.display_name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.joinDate}>
                Bergabung {new Date(user?.created_at || '').toLocaleDateString('id-ID')}
              </Text>
            </View>
            <Pressable onPress={handleEditSettings} style={styles.editButton}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Stats Overview - REAL-TIME UPDATED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Streak Saat Ini</Text>
                {/* Real-time indicator */}
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>Streak Terpanjang</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dailyGoal}</Text>
                <Text style={styles.statLabel}>Target Harian</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hasanat Card - Only if hasanat_visible is true */}
        {settings?.hasanat_visible && hasanatData && (
          <View style={{ marginBottom: 16 }}>
            <HasanatCard
              totalHasanat={hasanatData.totalHasanat}
              totalLetters={hasanatData.totalLetters}
              streakDays={0} // Not used in this context
              dailyAverage={0} // Not used in this context
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actionCard}>
            <Pressable onPress={handleViewDetailedStats} style={styles.actionButton}>
              <View style={styles.actionContent}>
                <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Lihat Statistik Lengkap</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.settingsCard}>
            <Pressable onPress={handleEditSettings} style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialCommunityIcons name="cog" size={24} color={colors.secondary} />
                <Text style={styles.settingText}>Pengaturan Akun</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondary} />
            </Pressable>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialCommunityIcons name="target" size={24} color={colors.secondary} />
                <Text style={styles.settingText}>Target Harian: {dailyGoal} ayat</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondary} />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun</Text>
          <View style={styles.accountCard}>
            <Pressable style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialCommunityIcons name="download" size={24} color={colors.secondary} />
                <Text style={styles.settingText}>Ekspor Data</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondary} />
            </Pressable>
            <Pressable style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialCommunityIcons name="help-circle" size={24} color={colors.secondary} />
                <Text style={styles.settingText}>Bantuan & Dukungan</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <Button title="Keluar" onPress={handleLogout} style={{ marginBottom: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  joinDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: colors.charcoal,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: colors.charcoal,
    fontWeight: '500',
    marginLeft: 12,
  },
});
