import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { scheduleDaily, ensureNotifPermission } from '../../lib/notifications';
import { posthog, EVENTS } from '../../config/posthog';
import { getTodayDate } from '../../utils/time';
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, DEFAULT_AYAT_COUNT, AYAT_COUNT_OPTIONS } from '../../utils/constants';
import { useCheckin } from '@/hooks/useCheckin';
import { useSyncStore } from '@/store/syncStore';
import { useMyFamilies } from '@/hooks/useFamily';
import { TreeView } from '@/components/TreeView';
import { didBreakYesterday } from '@/lib/streak';
import { colors } from '@/theme/colors';
import { getCurrentStreak } from '@/services/checkins';
import { getProfileTimezone } from '@/services/profile';
import { useQueryClient } from '@tanstack/react-query';

export default function HomeScreen() {
  const { todayCheckin, streak, hasCheckedInToday, isLoading, isSubmitting, submitCheckin, triggerSync } = useCheckin();
  const { isSyncing, pendingCount } = useSyncStore();
  const nav = useNavigation<any>();
  const familiesQ = useMyFamilies();
  const queryClient = useQueryClient();
  const [ayatCount, setAyatCount] = useState(DEFAULT_AYAT_COUNT);
  const [refreshing, setRefreshing] = useState(false);
  
  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    console.log('🧹 Clearing families cache on mount...');
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
  }, [queryClient]);
  
  // TreeView data
  const { data: timezoneData } = useQuery({
    queryKey: ['profile', 'timezone'],
    queryFn: getProfileTimezone,
    staleTime: 300_000, // 5 minutes
  });
  const tz = timezoneData ?? 'Asia/Jakarta';
  
  const { data: streakData, isLoading: streakLoading, error: streakError } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 30_000,
  });
  
  const onRefresh = async () => {
    setRefreshing(true);
    // Clear React Query cache for families
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
    await triggerSync();
    setRefreshing(false);
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
    Alert.alert('✅ Pengingat Diatur', `Kamu akan diingatkan setiap hari jam ${DEFAULT_REMINDER_HOUR}:00`);
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
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C896" colors={['#00C896']} />}
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
              <Text className="text-xs text-accent font-medium">{pendingCount} menunggu sinkron</Text>
            </View>
          )}
        </View>
      )}

      <View className="mt-4">
        <View className="flex-row">
          <Pressable onPress={()=>nav.navigate('CreateFamily')} className="bg-primary rounded-xl px-4 py-3 mr-2">
            <Text className="text-white font-medium">Buat Keluarga</Text>
          </Pressable>
          <Pressable onPress={()=>nav.navigate('JoinFamily')} className="bg-forest rounded-xl px-4 py-3">
            <Text className="text-white font-medium">Gabung</Text>
          </Pressable>
        </View>

        {familiesQ.isLoading ? (
          <View className="mt-4 p-4 bg-gray-100 rounded-xl">
            <ActivityIndicator color="#00C896" />
            <Text className="text-gray-600 text-center mt-2">Memuat keluarga...</Text>
          </View>
        ) : familiesQ.error ? (
          <View className="mt-4 p-4 bg-red-100 rounded-xl">
            <Text className="text-red-800">Error: {familiesQ.error.message}</Text>
          </View>
        ) : (familiesQ.data && familiesQ.data.length > 0) ? (
          <View className="mt-4">
            <Text className="text-charcoal font-medium mb-2">Keluargaku</Text>
            {(familiesQ.data || []).map((f:any)=>(
              <Pressable key={f.id || Math.random()} onPress={()=>nav.navigate('FamilyDashboard', { familyId: f.id })} className="bg-surface rounded-xl px-4 py-3 mb-2 border border-border">
                <Text className="text-charcoal">{f.name || 'Unknown Family'}</Text>
                <Text className="text-text-secondary text-xs mt-1">{f.role || 'member'}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="mt-4 p-4 bg-gray-100 rounded-xl">
            <Text className="text-gray-600 text-center">Belum ada keluarga</Text>
          </View>
        )}
      </View>

      {streak && (
        <View className="mt-4 flex-row items-center">
          <Text className="text-4xl">🔥</Text>
          <Text className="text-xl font-bold text-charcoal ml-2">{streak.current} hari berturut-turut</Text>
        </View>
      )}

      <View className="mt-6 p-4 rounded-xl bg-surface">
        <Text className="text-base text-charcoal mb-3">
          {hasCheckedInToday ? `Alhamdulillah! Sudah ${todayCheckin?.ayat_count} ayat hari ini ✅` : "Sudah baca Al-Qur'an hari ini?"}
        </Text>

        {!hasCheckedInToday && (
          <>
            <View className="flex-row justify-around mb-4">
              {(AYAT_COUNT_OPTIONS || []).map((n) => (
                <Pressable key={n} onPress={() => setAyatCount(n)} className={`px-4 py-2 rounded-lg ${ayatCount === n ? 'bg-primary' : 'bg-background'}`}>
                  <Text className={ayatCount === n ? 'text-white font-medium' : 'text-charcoal font-medium'}>{n} ayat</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => { if (hasCheckedInToday) { Alert.alert('Sudah Dicatat', 'Kamu sudah mencatat bacaan hari ini. Alhamdulillah! 🌱'); return; } submitCheckin(ayatCount); triggerSync(); Alert.alert('Alhamdulillah! ✅', `${ayatCount} ayat tercatat.`); }} disabled={isSubmitting} className="bg-primary rounded-xl px-4 py-3 active:opacity-80" style={{ minHeight: 48 }}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white text-center font-medium">Catat Bacaan Hari Ini</Text>}
            </Pressable>
          </>
        )}

        <Pressable onPress={handleSetReminder} className="bg-forest rounded-xl px-4 py-3 mt-3">
          <Text className="text-white text-center font-medium">Atur Pengingat Harian</Text>
        </Pressable>
      </View>



      <View className="mt-4 p-4 rounded-xl bg-sand">
        <Text className="text-sm text-text-secondary">💡 Tip: Progres kamu tersimpan offline. Akan tersinkron saat online.</Text>
      </View>
    </ScrollView>
  );
}


