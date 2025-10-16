import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function ensureNotifPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notifications] Not a physical device');
    return false;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDaily(hour: number, minute: number, body: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Miqra', body, sound: false },
    trigger: { hour, minute, repeats: true },
  });
  console.log(`[Notifications] Scheduled daily at ${hour}:${minute}`);
}

export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}


