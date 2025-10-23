import * as Device from 'expo-device';

// Conditional import for notifications to avoid Expo Go errors
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('[Notifications] expo-notifications not available in Expo Go');
}

export async function ensureNotifPermission(): Promise<boolean> {
  if (!Notifications) {
    console.log('[Notifications] Notifications not available');
    return false;
  }
  if (!Device.isDevice) {
    console.log('[Notifications] Not a physical device');
    return false;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDaily(
  hour: number,
  minute: number,
  body: string
) {
  if (!Notifications) {
    console.log(
      '[Notifications] Notifications not available - cannot schedule'
    );
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Miqra', body, sound: false },
    trigger: { hour, minute, repeats: true },
  });
  console.log(`[Notifications] Scheduled daily at ${hour}:${minute}`);
}

export async function getPushToken(): Promise<string | null> {
  if (!Notifications) {
    console.log('[Notifications] Notifications not available');
    return null;
  }
  if (!Device.isDevice) return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
