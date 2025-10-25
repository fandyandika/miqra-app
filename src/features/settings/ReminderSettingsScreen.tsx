import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/services/profile';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  scheduleStreakWarning,
  cancelAllNotifications,
} from '@/services/notifications';
import { getCachedPrayerTimes, applyPrayerBuffer, clampToQuietHours } from '@/services/prayerTimes';
import { registerDailyRescheduler } from '@/services/notifications';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingToggle } from '@/components/settings/SettingToggle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ReminderSettingsScreen() {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStreakTimePicker, setShowStreakTimePicker] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  useEffect(() => {
    registerDailyRescheduler(); // supaya harian otomatis reschedule
  }, []);

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const ok = await requestNotificationPermissions();
      if (!ok) {
        Alert.alert('Izin Diperlukan', 'Aktifkan izin notifikasi.');
        return;
      }

      // prayer-aware schedule menggunakan jam dari settings (atau 06:00)
      await scheduleDailyReminder(settings?.reminder_time || '06:00');
      if (settings?.streak_warning_enabled) await scheduleStreakWarning();
    } else {
      await cancelAllNotifications();
    }
    updateMutation.mutate({ daily_reminder_enabled: enabled });
  };

  const handleToggleStreakWarning = async (enabled: boolean) => {
    if (enabled) {
      const ok = await requestNotificationPermissions();
      if (!ok) {
        Alert.alert('Izin Diperlukan', 'Aktifkan izin notifikasi.');
        return;
      }

      await scheduleStreakWarning();
    } else {
      // Cancel only streak warning notifications
      // Note: This would need a specific cancel function for streak warnings
    }
    updateMutation.mutate({ streak_warning_enabled: enabled });
  };

  const handleTimeChange = async (_: any, date?: Date) => {
    setShowTimePicker(false);
    if (!date) return;

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    let hm = `${hh}:${mm}`;

    const pt = await getCachedPrayerTimes(null);
    const original = hm;
    hm = clampToQuietHours(hm);
    hm = applyPrayerBuffer(hm, pt, 15, 20);

    updateMutation.mutate({ reminder_time: hm });

    if (settings?.daily_reminder_enabled) await scheduleDailyReminder(hm);

    if (hm !== original) {
      Alert.alert(
        'Waktu Disesuaikan',
        `Untuk menghormati waktu sholat/quiet hours, pengingat digeser ke ${hm}.`
      );
    }
  };

  const handleUseOptimalTime = async () => {
    const pt = await getCachedPrayerTimes(null);
    // default "optimal" kita set 30m setelah Fajr → lalu apply clamp/buffer agar aman
    const [fh, fm] = pt.fajr.split(':').map(Number);
    const base = `${String(fh).padStart(2, '0')}:${String(fm + 30).padStart(2, '0')}`;
    let hm = clampToQuietHours(base);
    hm = applyPrayerBuffer(hm, pt, 15, 20);

    updateMutation.mutate({ reminder_time: hm });
    if (settings?.daily_reminder_enabled) await scheduleDailyReminder(hm);
    Alert.alert('Waktu Optimal', `Pengingat diatur ke ${hm} (≈ 30 menit setelah Subuh).`);
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
  };

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Info Box */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            Notifikasi akan otomatis menyesuaikan agar tidak mengganggu waktu sholat dan jam tidur
            (23:00–05:00).
          </Text>
        </Card>

        {/* Daily Reminder Section */}
        <SettingSection title="Pengingat Harian">
          <SettingToggle
            label="Aktifkan Pengingat"
            value={settings?.daily_reminder_enabled || false}
            onChange={handleToggleReminder}
          />

          {settings?.daily_reminder_enabled && (
            <>
              <TouchableOpacity style={styles.timeRow} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timeLabel}>Waktu Pengingat</Text>
                <Text style={styles.timeValue}>
                  {formatTime(settings?.reminder_time || '06:00')}
                </Text>
              </TouchableOpacity>

              <Button
                title="Gunakan Waktu Optimal"
                onPress={handleUseOptimalTime}
                variant="secondary"
                style={styles.optimalButton}
              />
            </>
          )}
        </SettingSection>

        {/* Streak Warning Section */}
        <SettingSection title="Peringatan Streak">
          <SettingToggle
            label="Aktifkan Peringatan Streak"
            value={settings?.streak_warning_enabled || false}
            onChange={handleToggleStreakWarning}
          />
          <Text style={styles.streakDescription}>
            Peringatan akan dikirim sebelum Maghrib jika belum membaca hari ini.
          </Text>
        </SettingSection>

        {/* Time Pickers */}
        {showTimePicker && (
          <DateTimePicker
            value={parseTime(settings?.reminder_time || '06:00')}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  optimalButton: {
    marginTop: 12,
  },
  streakDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
