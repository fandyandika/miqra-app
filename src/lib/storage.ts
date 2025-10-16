import { MMKV } from 'react-native-mmkv';

export const kv = new MMKV();

export const getKV = (key: string): string | undefined => kv.getString(key);

export const setKV = (key: string, value: string): void => {
  kv.set(key, value);
};

export const deleteKV = (key: string): void => {
  kv.delete(key);
};

export const clearKV = (): void => {
  kv.clearAll();
};


