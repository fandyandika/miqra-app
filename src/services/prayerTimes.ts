import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type PrayerTimes = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string; // YYYY-MM-DD (lokal)
  lat?: number;
  lon?: number;
  city?: string;
};

const PRAYER_TIMES_CACHE_KEY = 'prayer_times_cache_v1';

function formatLocalDate(d: Date) {
  // YYYY-MM-DD di zona waktu perangkat (bukan UTC)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getCoordsOrNull(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}

/** Ambil dari Aladhan (method 20 = Kemenag) + fallback Jakarta */
export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  date?: Date
): Promise<PrayerTimes> {
  const target = date ?? new Date();
  const dateStr = formatLocalDate(target);

  try {
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=20`;
    const res = await fetch(url);
    const json = await res.json();

    if (json?.code !== 200) throw new Error('Bad response');
    const t = json.data.timings;
    const city = json.data.meta?.timezone ?? undefined;

    return {
      fajr: t.Fajr,
      sunrise: t.Sunrise,
      dhuhr: t.Dhuhr,
      asr: t.Asr,
      maghrib: t.Maghrib,
      isha: t.Isha,
      date: dateStr,
      lat: latitude,
      lon: longitude,
      city,
    };
  } catch {
    return {
      fajr: '04:30',
      sunrise: '05:45',
      dhuhr: '12:00',
      asr: '15:15',
      maghrib: '18:00',
      isha: '19:15',
      date: dateStr,
      lat: latitude,
      lon: longitude,
      city: 'Fallback',
    };
  }
}

export async function getCachedPrayerTimes(
  coords?: { latitude: number; longitude: number } | null
): Promise<PrayerTimes> {
  const today = formatLocalDate(new Date());

  // baca cache
  try {
    const cachedRaw = await AsyncStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as PrayerTimes;
      if (cached.date === today) return cached;
    }
  } catch {}

  const c = coords ?? (await getCoordsOrNull());
  const lat = c?.latitude ?? -6.2; // Jakarta
  const lon = c?.longitude ?? 106.816666;

  const times = await fetchPrayerTimes(lat, lon);
  try {
    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(times));
  } catch {}
  return times;
}

/** Parse "HH:mm" menjadi menit sejak 00:00  */
export function hmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Kembalikan "HH:mm" dari menit */
export function minutesToHm(mins: number) {
  const m = ((mins % 1440) + 1440) % 1440; // normalisasi
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Apakah sebuah jam berada di buffer ±N menit dari salah satu waktu salat */
export function isWithinPrayerBuffer(timeHm: string, pt: PrayerTimes, buffer = 15) {
  const t = hmToMinutes(timeHm);
  const checks = [pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha].map(hmToMinutes);
  return checks.some((p) => Math.abs(t - p) <= buffer);
}

/** Geser waktu ke +offset menit bila masuk buffer; jika masih tabrakan, geser lagi bertahap */
export function applyPrayerBuffer(timeHm: string, pt: PrayerTimes, buffer = 15, shift = 20) {
  let t = hmToMinutes(timeHm);
  for (let i = 0; i < 3; i++) {
    if (!isWithinPrayerBuffer(minutesToHm(t), pt, buffer)) break;
    t += shift;
  }
  return minutesToHm(t);
}

/** Quiet hours 23:00–05:00 → geser ke 05:10 */
export function clampToQuietHours(timeHm: string) {
  const t = hmToMinutes(timeHm);
  const startQuiet = 23 * 60; // 23:00
  const endQuiet = 5 * 60; // 05:00
  if (t >= startQuiet || t < endQuiet) return '05:10';
  return timeHm;
}
