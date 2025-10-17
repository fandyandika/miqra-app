import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Conditional import for MMKV to avoid Expo Go errors
let MMKV: any = null;
let kv: any = null;

try {
  if (Platform.OS !== 'web') {
    MMKV = require('react-native-mmkv').MMKV;
    kv = new MMKV();
  }
} catch (error) {
  console.log('[Storage] MMKV not available, using AsyncStorage fallback');
}

// Fallback storage functions
export const getKV = async (key: string): Promise<string | undefined> => {
  if (kv) {
    return kv.getString(key);
  }
  return await AsyncStorage.getItem(key) || undefined;
};

export const setKV = async (key: string, value: string): Promise<void> => {
  if (kv) {
    kv.set(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const deleteKV = async (key: string): Promise<void> => {
  if (kv) {
    kv.delete(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

export const clearKV = async (): Promise<void> => {
  if (kv) {
    kv.clearAll();
  } else {
    await AsyncStorage.clear();
  }
};


