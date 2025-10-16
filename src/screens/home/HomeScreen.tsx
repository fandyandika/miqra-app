import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { scheduleDaily, ensureNotifPermission } from '../../lib/notifications';
import { posthog, EVENTS } from '../../config/posthog';
import { getTodayDate } from '../../utils/time';
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE } from '../../utils/constants';

export default function HomeScreen() {
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

  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Text className="text-2xl font-semibold text-charcoal">
        Assalamu'alaikum Warahmatullahi Wabarakatuh
      </Text>

      <View className="mt-6 p-4 rounded-xl bg-surface">
        <Text className="text-base text-charcoal mb-3">
          Sudah baca 5 ayat Al-Qur'an hari ini?
        </Text>
        <Pressable
          onPress={handleSetReminder}
          className="bg-primary rounded-xl px-4 py-3 active:opacity-80"
          style={{ minHeight: 48 }} // MIN_TOUCH_TARGET for elderly
        >
          <Text className="text-white text-center font-medium">
            Atur Pengingat Waktu Baca Qur'an
          </Text>
        </Pressable>
      </View>

      <View className="mt-4 p-4 rounded-xl bg-sand">
        <Text className="text-sm text-text-secondary">
          💡 Tips: Mulai baca Al-Qur'an 5 ayat setiap hari. Yang penting istiqomah setiap hari.
        </Text>
      </View>
    </View>
  );
}


