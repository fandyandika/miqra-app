import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { scheduleDaily, ensureNotifPermission } from '../../lib/notifications';
import { posthog, EVENTS } from '../../config/posthog';
import { getTodayDate } from '../../utils/time';
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE } from '../../utils/constants';
import { useCheckin } from '@/hooks/useCheckin';
import { useSyncStore } from '@/store/syncStore';
import { useMyFamilies } from '@/hooks/useFamily';
import { TreeView } from '@/components/TreeView';
import { didBreakYesterday } from '@/lib/streak';
import { colors } from '@/theme/colors';
import { getCurrentStreak } from '@/services/checkins';
import { getProfileTimezone } from '@/services/profile';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { todayCheckin, streak, hasCheckedInToday, isLoading, triggerSync } = useCheckin();
  const { isSyncing, pendingCount } = useSyncStore();
  const nav = useNavigation<any>();
  const familiesQ = useMyFamilies();
  const queryClient = useQueryClient();

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    console.log('🧹 Clearing families cache on mount...');
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
  }, [queryClient]);

  // Real-time updates for streak and reading data
  useEffect(() => {
    const channel = supabase
      .channel('home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
        console.log('[HomeScreen] Checkins updated, invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['checkin'] });
        queryClient.invalidateQueries({ queryKey: ['streak'] });
        queryClient.invalidateQueries({ queryKey: ['reading'] });
        queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
        queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_sessions' }, () => {
        console.log('[HomeScreen] Reading sessions updated, invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['reading'] });
        queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
        queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // TreeView data
  const { data: timezoneData } = useQuery({
    queryKey: ['profile', 'timezone'],
    queryFn: getProfileTimezone,
    staleTime: 300_000, // 5 minutes
  });
  const tz = timezoneData ?? 'Asia/Jakarta';

  const {
    data: streakData,
    isLoading: streakLoading,
    error: streakError,
  } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 0, // Always fresh
  });

  const onRefresh = async () => {
    // Clear React Query cache for families
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
    await triggerSync();
  };

  const handleSetReminder = async () => {
    const hasPermission = await ensureNotifPermission();
    if (!hasPermission) {
      Alert.alert(
        'Izin Diperlukan',
        "Kami ingin mengingatkan kamu untuk membaca Al-Qur'an setiap hari. Izinkan notifikasi?"
      );
      return;
    }
    await scheduleDaily(
      DEFAULT_REMINDER_HOUR,
      DEFAULT_REMINDER_MINUTE,
      "Gentle reminder to read Qur'an today 🌱"
    );
    posthog?.capture(EVENTS.REMINDER_SCHEDULED, {
      hour: DEFAULT_REMINDER_HOUR,
      minute: DEFAULT_REMINDER_MINUTE,
      date: getTodayDate(),
    });
    Alert.alert(
      '✅ Pengingat Diatur',
      `Kamu akan diingatkan setiap hari jam ${DEFAULT_REMINDER_HOUR}:00`
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#00C896" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 70 }}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={onRefresh}
          tintColor="#00C896"
          colors={['#00C896']}
        />
      }
    >
      <Text className="text-2xl font-semibold text-charcoal">As-salamu alaykum</Text>

      {/* TreeView Hero Section */}
      {(() => {
        if (streakLoading) {
          return (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator />
              <Text style={{ color: colors.mutedText, marginTop: 8 }}>Memuat progres...</Text>
            </View>
          );
        } else if (streakError || !streakData) {
          return (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <TreeView currentStreakDays={0} brokeYesterday={false} />
              <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 6 }}>
                Data tersimpan offline. Akan tersinkron otomatis.
              </Text>
            </View>
          );
        } else {
          const current = streakData.current ?? 0;
          const last = streakData.last_date ?? null;
          const broke = didBreakYesterday(last, tz);
          return (
            <TreeView
              currentStreakDays={current}
              brokeYesterday={broke}
              onPress={() => nav.navigate('TreeFullScreen')}
            />
          );
        }
      })()}

      {(isSyncing || pendingCount > 0) && (
        <View className="mt-2 flex-row items-center">
          {isSyncing ? (
            <>
              <ActivityIndicator size="small" color="#00C896" />
              <Text className="text-sm text-text-secondary ml-2">Menyinkronkan...</Text>
            </>
          ) : (
            <View className="flex-row items-center bg-accent/20 px-3 py-1 rounded-full">
              <Text className="text-xs text-accent font-medium">
                {pendingCount} menunggu sinkron
              </Text>
            </View>
          )}
        </View>
      )}

      {streak && streak.current && (
        <View className="mt-4 flex-row items-center">
          <Text className="text-4xl">🔥</Text>
          <Text className="text-xl font-bold text-charcoal ml-2">
            {streak.current} hari berturut-turut
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
