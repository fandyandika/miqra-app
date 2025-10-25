import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/services/profile';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  scheduleStreakWarning,
  cancelAllNotifications,
  PRESET_TIMES,
} from '@/services/notifications';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingToggle } from '@/components/settings/SettingToggle';
import Card from '@/components/ui/Card';
import { colors } from '@/theme/colors';

export default function ReminderSettingsScreen() {
  const [selectedPreset, setSelectedPreset] = useState('morning');
  const [customTime, setCustomTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
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
    // Set initial preset based on current settings
    if (settings?.reminder_time) {
      const currentTime = settings.reminder_time.slice(0, 5); // Remove seconds
      const matchingPreset = PRESET_TIMES.find((preset) => preset.time === currentTime);
      if (matchingPreset) {
        setSelectedPreset(matchingPreset.id);
      } else {
        // If no matching preset, it's a custom time
        setSelectedPreset('custom');
        const [hours, minutes] = currentTime.split(':').map(Number);
        const customDate = new Date();
        customDate.setHours(hours, minutes, 0, 0);
        setCustomTime(customDate);
      }
    }
  }, [settings]);

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const ok = await requestNotificationPermissions();
      if (!ok) {
        Alert.alert('Izin Diperlukan', 'Aktifkan izin notifikasi.');
        return;
      }

      // Schedule with current preset time
      const currentPreset = PRESET_TIMES.find((p) => p.id === selectedPreset);
      await scheduleDailyReminder(currentPreset?.time || '06:00');
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

  const handlePresetSelect = async (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESET_TIMES.find((p) => p.id === presetId);
    if (!preset) return;

    if (presetId === 'custom') {
      setShowTimePicker(true);
      return;
    }

    if (preset.time) {
      updateMutation.mutate({
        reminder_time: preset.time + ':00', // Add seconds for database
        reminder_preset: presetId,
      });
    }

    if (settings?.daily_reminder_enabled && preset.time) {
      await scheduleDailyReminder(preset.time);
    }
  };

  const handleCustomTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate) return;

    setCustomTime(selectedDate);
    const timeString = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;

    updateMutation.mutate({
      reminder_time: timeString + ':00', // Add seconds for database
      reminder_preset: 'custom',
    });

    if (settings?.daily_reminder_enabled) {
      await scheduleDailyReminder(timeString);
    }
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
            Notifikasi dikirim sesuai waktu yang Anda pilih. Pilih waktu yang paling sesuai dengan
            rutinitas Anda.
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pilih Waktu</Text>

              {PRESET_TIMES.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    preset.id === 'custom' && styles.customOption,
                    selectedPreset === preset.id && styles.presetSelected,
                  ]}
                  onPress={() => handlePresetSelect(preset.id)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <View style={styles.presetContent}>
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                    <Text style={styles.presetTime}>
                      {preset.id === 'custom' && selectedPreset === 'custom'
                        ? `${customTime.getHours().toString().padStart(2, '0')}:${customTime.getMinutes().toString().padStart(2, '0')}`
                        : preset.time}
                    </Text>
                  </View>
                  <View style={styles.radio}>
                    {selectedPreset === preset.id && <View style={styles.radioSelected} />}
                  </View>
                </Pressable>
              ))}

              {selectedPreset === 'custom' && showTimePicker && (
                <DateTimePicker
                  value={customTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleCustomTimeChange}
                />
              )}
            </View>
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
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  presetSelected: {
    borderColor: colors.primary,
  },
  customOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  presetContent: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  presetTime: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  streakDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
