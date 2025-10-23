import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const supabaseUrl = (Constants.expoConfig?.extra as any)?.SUPABASE_URL;
const supabaseAnonKey = (Constants.expoConfig?.extra as any)?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing credentials - auth will not work');
}

// Web-compatible storage
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

console.log('[Supabase] Client initialized');
