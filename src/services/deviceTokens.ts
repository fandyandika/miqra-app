import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

export async function registerDeviceToken() {
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('device_tokens').upsert({ user_id: user.id, token }, { onConflict: 'token' });
}
