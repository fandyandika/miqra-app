import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType =
  | 'daily_reminder'
  | 'streak_warning'
  | 'family_activity'
  | 'milestone';

export const PRESET_TIMES = [
  { id: 'fajr', time: '05:30', label: 'Setelah Subuh', icon: '🌅' },
  { id: 'morning', time: '06:00', label: 'Pagi Hari', icon: '☀️' },
  { id: 'isha', time: '19:45', label: 'Setelah Isya', icon: '🌙' },
  { id: 'night', time: '21:30', label: 'Sebelum Tidur', icon: '🌃' },
  { id: 'custom', time: null, label: 'Atur Sendiri', icon: '⏰' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEYS = {
  DAILY_ID: 'notif_daily_id_v1',
  LAST_SCHEDULED_HM: 'notif_last_hm_v1',
};

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pengingat Bacaan',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: null,
      enableVibrate: true,
    });
  }
  return true;
}

/** Cancel by type */
export async function cancelNotificationsByType(type: NotificationType) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.map((n) =>
      n.content.data?.type === type
        ? Notifications.cancelScheduledNotificationAsync(n.identifier)
        : Promise.resolve()
    )
  );
}

/** Daily reminder — simplified with preset times */
export async function scheduleDailyReminder(reminderTime: string): Promise<string | null> {
  try {
    await cancelNotificationsByType('daily_reminder');

    const [hours, minutes] = reminderTime.split(':').map(Number);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Saatnya Membaca Al-Qur'an 📖",
        body: 'Luangkan waktu sebentar untuk membaca. Semangat istiqomah!',
        data: { type: 'daily_reminder' },
        sound: false,
      },
      trigger: null, // Immediate notification for testing
    });

    await AsyncStorage.setItem('daily_reminder_id', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling:', error);
    return null;
  }
}

/** Streak warning: simplified to 18:00 */
export async function scheduleStreakWarning(): Promise<string | null> {
  try {
    await cancelNotificationsByType('streak_warning');

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Jangan Putus Streak!',
        body: 'Hari ini belum membaca. Yuk, baca minimal 1 ayat untuk pertahankan streak.',
        data: { type: 'streak_warning' },
        sound: false,
      },
      trigger: null, // Immediate notification for testing
    });

    return notificationId;
  } catch (e) {
    console.error('scheduleStreakWarning error', e);
    return null;
  }
}

/** Milestone & Family: tetap immediate local (tanpa sound) */
export async function sendFamilyActivityNotification(memberName: string, ayatCount: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '👨‍👩‍👧‍👦 Aktivitas Keluarga',
      body: `${memberName} membaca ${ayatCount} ayat. MasyaAllah!`,
      data: { type: 'family_activity' },
      sound: false,
    },
    trigger: null,
  });
}

export async function sendMilestoneNotification(m: string, msg: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 ${m}`,
      body: msg,
      data: { type: 'milestone' },
      sound: false,
    },
    trigger: null,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
