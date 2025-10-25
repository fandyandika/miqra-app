import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedPrayerTimes,
  getCoordsOrNull,
  applyPrayerBuffer,
  clampToQuietHours,
  hmToMinutes,
  minutesToHm,
} from './prayerTimes';

export type NotificationType =
  | 'daily_reminder'
  | 'streak_warning'
  | 'family_activity'
  | 'milestone';

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

/** Jadwalkan notifikasi one-off pada HH:mm hari ini atau besok bila waktu telah lewat */
async function scheduleOneOffAt(hm: string, data: any) {
  const now = new Date();
  const [h, m] = hm.split(':').map(Number);
  const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (fireAt.getTime() <= now.getTime()) fireAt.setDate(fireAt.getDate() + 1);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: data?.title ?? "📖 Saatnya Membaca Al-Qur'an",
      body: data?.body ?? 'Luangkan waktu sebentar untuk membaca. Semangat istiqomah!',
      data: { type: data?.type ?? 'daily_reminder' },
      sound: false,
    },
    trigger: null,
  });
  return id;
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

/** Daily reminder — prayer-aware + quiet hours + buffer (ONE-OFF) */
export async function scheduleDailyReminder(
  preferredHm: string // "HH:mm" dari settings
): Promise<string | null> {
  try {
    await cancelNotificationsByType('daily_reminder');

    const coords = await getCoordsOrNull(); // boleh null
    const pt = await getCachedPrayerTimes(coords);

    // 1) mulai dari preferensi user
    let hm = preferredHm;

    // 2) hormati quiet hours
    hm = clampToQuietHours(hm);

    // 3) hormati buffer waktu salat
    hm = applyPrayerBuffer(hm, pt, 15, 20);

    // 4) schedule one-off
    const id = await scheduleOneOffAt(hm, { type: 'daily_reminder' });

    // 5) simpan info untuk reschedule besok (via BackgroundFetch)
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.DAILY_ID, id],
      [STORAGE_KEYS.LAST_SCHEDULED_HM, hm],
    ]);

    return id;
  } catch (e) {
    console.error('scheduleDailyReminder error', e);
    return null;
  }
}

/** Streak warning: default 18:00 tapi digeser aman dari Maghrib dan quiet hours */
export async function scheduleStreakWarning(): Promise<string | null> {
  try {
    await cancelNotificationsByType('streak_warning');

    const coords = await getCoordsOrNull();
    const pt = await getCachedPrayerTimes(coords);

    // target dasar 18:00, tapi jangan menabrak maghrib → pilih min(18:00, maghrib-20m)
    const magMins = hmToMinutes(pt.maghrib);
    const target = Math.min(hmToMinutes('18:00'), magMins - 20);
    let hm = minutesToHm(target);

    hm = clampToQuietHours(hm);
    hm = applyPrayerBuffer(hm, pt, 15, 20);

    return await scheduleOneOffAt(hm, {
      type: 'streak_warning',
      title: '🔥 Jangan Putus Streak!',
      body: 'Hari ini belum membaca. Yuk, baca minimal 1 ayat untuk pertahankan streak.',
    });
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

/* ====== Background re-scheduler (harian) ====== */
const TASK_NAME = 'miqra-reschedule-daily-reminder';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const coords = await getCoordsOrNull();
    const pt = await getCachedPrayerTimes(coords);
    const preferred = (await AsyncStorage.getItem(STORAGE_KEYS.LAST_SCHEDULED_HM)) ?? '06:00';

    let hm = clampToQuietHours(preferred);
    hm = applyPrayerBuffer(hm, pt, 15, 20);

    await cancelNotificationsByType('daily_reminder');
    const id = await scheduleOneOffAt(hm, { type: 'daily_reminder' });
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.DAILY_ID, id],
      [STORAGE_KEYS.LAST_SCHEDULED_HM, hm],
    ]);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('BG reschedule error', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerDailyRescheduler() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60 * 6,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {}
}

export async function unregisterDailyRescheduler() {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch {}
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
