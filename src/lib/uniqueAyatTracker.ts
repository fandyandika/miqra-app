import { SURAH_META } from '@/data/quran_meta';

export type AyatPosition = {
  surah: number;
  ayat: number;
};

export type UniqueAyatData = {
  totalUniqueAyat: number;
  totalQuran: number;
  percentage: number;
  remaining: number;
  khatamCount: number;
  uniquePositions: Set<string>;
  lastPosition: AyatPosition | null;
};

/**
 * Convert surah+ayat to unique key
 */
export function getAyatKey(surah: number, ayat: number): string {
  return `${surah}-${ayat}`;
}

/**
 * Parse ayat key back to position
 */
export function parseAyatKey(key: string): AyatPosition {
  const [surah, ayat] = key.split('-').map(Number);
  return { surah, ayat };
}

/**
 * Get all ayat positions in a range
 */
export function getAyatPositionsInRange(surah: number, start: number, end: number): AyatPosition[] {
  const positions: AyatPosition[] = [];
  for (let ayat = start; ayat <= end; ayat++) {
    positions.push({ surah, ayat });
  }
  return positions;
}

/**
 * Calculate unique ayat progress from reading sessions
 */
export function calculateUniqueAyatProgress(
  sessions: {
    surah_number: number;
    ayat_start: number;
    ayat_end: number;
    session_time: string;
  }[]
): UniqueAyatData {
  const uniquePositions = new Set<string>();
  let lastPosition: AyatPosition | null = null;
  let latestTime = '';

  // Process sessions chronologically
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.session_time).getTime() - new Date(b.session_time).getTime()
  );

  for (const session of sortedSessions) {
    const positions = getAyatPositionsInRange(
      session.surah_number,
      session.ayat_start,
      session.ayat_end
    );

    for (const pos of positions) {
      const key = getAyatKey(pos.surah, pos.ayat);
      uniquePositions.add(key);
    }

    // Track latest position
    if (session.session_time > latestTime) {
      latestTime = session.session_time;
      lastPosition = {
        surah: session.surah_number,
        ayat: session.ayat_end,
      };
    }
  }

  const totalUniqueAyat = uniquePositions.size;
  const totalQuran = 6236; // Total ayat in Quran
  const percentage = Math.min(100, (totalUniqueAyat / totalQuran) * 100);
  const remaining = Math.max(0, totalQuran - totalUniqueAyat);
  const khatamCount = Math.floor(totalUniqueAyat / totalQuran);

  return {
    totalUniqueAyat,
    totalQuran,
    percentage: Math.round(percentage * 10) / 10,
    remaining,
    khatamCount,
    uniquePositions,
    lastPosition,
  };
}

/**
 * Get next unread ayat position
 */
export function getNextUnreadPosition(
  uniquePositions: Set<string>,
  currentSurah: number = 1,
  currentAyat: number = 1
): AyatPosition {
  // Start from current position
  for (let surah = currentSurah; surah <= 114; surah++) {
    const surahMeta = SURAH_META.find((s) => s.number === surah);
    if (!surahMeta) continue;

    const startAyat = surah === currentSurah ? currentAyat : 1;

    for (let ayat = startAyat; ayat <= surahMeta.ayatCount; ayat++) {
      const key = getAyatKey(surah, ayat);
      if (!uniquePositions.has(key)) {
        return { surah, ayat };
      }
    }
  }

  // If all ayat are read, start from beginning
  return { surah: 1, ayat: 1 };
}

/**
 * Get reading coverage for a surah
 */
export function getSurahCoverage(
  surah: number,
  uniquePositions: Set<string>
): {
  read: number;
  total: number;
  percentage: number;
  missingRanges: { start: number; end: number }[];
} {
  const surahMeta = SURAH_META.find((s) => s.number === surah);
  if (!surahMeta) {
    return { read: 0, total: 0, percentage: 0, missingRanges: [] };
  }

  const readAyat = new Set<number>();
  for (let ayat = 1; ayat <= surahMeta.ayatCount; ayat++) {
    const key = getAyatKey(surah, ayat);
    if (uniquePositions.has(key)) {
      readAyat.add(ayat);
    }
  }

  const missingRanges: { start: number; end: number }[] = [];
  let rangeStart: number | null = null;

  for (let ayat = 1; ayat <= surahMeta.ayatCount; ayat++) {
    if (!readAyat.has(ayat)) {
      if (rangeStart === null) {
        rangeStart = ayat;
      }
    } else {
      if (rangeStart !== null) {
        missingRanges.push({ start: rangeStart, end: ayat - 1 });
        rangeStart = null;
      }
    }
  }

  if (rangeStart !== null) {
    missingRanges.push({ start: rangeStart, end: surahMeta.ayatCount });
  }

  return {
    read: readAyat.size,
    total: surahMeta.ayatCount,
    percentage: Math.round((readAyat.size / surahMeta.ayatCount) * 100),
    missingRanges,
  };
}
