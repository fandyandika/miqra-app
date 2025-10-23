import { addDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

export const TOTAL_QURAN_AYAT = 6236;

export type ProgressData = {
  totalRead: number;
  totalQuran: number;
  percentage: number; // 0..100
  remaining: number; // ayat
  currentSurah: number;
  currentAyat: number;
  khatamCount: number;
};

export type CompletionEstimate = {
  avgPerDay: number; // ayat/hari (berdasar hari aktif)
  daysRemaining: number; // dibulatkan ke atas
  estimatedDate: Date | null;
  estimatedDateText: string;
};

/** Current progress based on total_ayat_read (supports multi-khatam) */
export function calculateProgress(
  totalAyatRead: number,
  currentSurah: number,
  currentAyat: number,
  khatamCount: number = 0
): ProgressData {
  const adjustedRead = ((totalAyatRead % TOTAL_QURAN_AYAT) + TOTAL_QURAN_AYAT) % TOTAL_QURAN_AYAT; // guard
  const percentage = Math.min(100, (adjustedRead / TOTAL_QURAN_AYAT) * 100);
  const remaining = Math.max(0, TOTAL_QURAN_AYAT - adjustedRead);

  return {
    totalRead: adjustedRead,
    totalQuran: TOTAL_QURAN_AYAT,
    percentage: Math.round(percentage * 10) / 10,
    remaining,
    currentSurah,
    currentAyat,
    khatamCount,
  };
}

/** Estimate completion date from recent pace (unique active days) */
export function estimateCompletion(
  totalAyatRead: number,
  recentSessions: { date: string; ayat_count: number }[],
  daysWindow: number = 30
): CompletionEstimate {
  if (!recentSessions || recentSessions.length === 0) {
    return {
      avgPerDay: 0,
      daysRemaining: 0,
      estimatedDate: null,
      estimatedDateText: 'Belum ada data bacaan',
    };
  }

  const totalRecent = recentSessions.reduce((sum, s) => sum + (s.ayat_count || 0), 0);
  const uniqueDates = new Set(recentSessions.map((s) => s.date));
  const daysRead = uniqueDates.size;
  const avgPerDay = daysRead > 0 ? Math.round(totalRecent / daysRead) : 0;

  if (avgPerDay <= 0) {
    return {
      avgPerDay: 0,
      daysRemaining: 0,
      estimatedDate: null,
      estimatedDateText: 'Belum cukup data',
    };
  }

  const currentProgress =
    ((totalAyatRead % TOTAL_QURAN_AYAT) + TOTAL_QURAN_AYAT) % TOTAL_QURAN_AYAT;
  const remaining = Math.max(0, TOTAL_QURAN_AYAT - currentProgress);
  const daysRemaining = Math.ceil(remaining / avgPerDay);

  const estimatedDate = addDays(new Date(), daysRemaining);
  const estimatedDateText = format(estimatedDate, 'd MMMM yyyy', {
    locale: id,
  });

  return { avgPerDay, daysRemaining, estimatedDate, estimatedDateText };
}

/** Milestone badges across one khatam loop */
export type Milestone = {
  id: string;
  label: string;
  targetAyat: number;
  percentage: number;
  achieved: boolean;
  icon: string; // emoji placeholder → can replace with Lottie later
};

export function getMilestones(totalAyatRead: number): Milestone[] {
  const current = ((totalAyatRead % TOTAL_QURAN_AYAT) + TOTAL_QURAN_AYAT) % TOTAL_QURAN_AYAT;
  const p = (x: number) => Math.round(TOTAL_QURAN_AYAT * x);

  const list: Milestone[] = [
    {
      id: 'start',
      label: 'Memulai Perjalanan',
      targetAyat: 1,
      percentage: 0,
      achieved: current >= 1,
      icon: '🌱',
    },
    {
      id: 'p5',
      label: '5% Pertama',
      targetAyat: p(0.05),
      percentage: 5,
      achieved: current >= p(0.05),
      icon: '📗',
    },
    {
      id: 'p10',
      label: '10% Khatam',
      targetAyat: p(0.1),
      percentage: 10,
      achieved: current >= p(0.1),
      icon: '📘',
    },
    {
      id: 'p25',
      label: 'Seperempat Jalan',
      targetAyat: p(0.25),
      percentage: 25,
      achieved: current >= p(0.25),
      icon: '⭐',
    },
    {
      id: 'p50',
      label: 'Setengah Perjalanan',
      targetAyat: p(0.5),
      percentage: 50,
      achieved: current >= p(0.5),
      icon: '🌟',
    },
    {
      id: 'p75',
      label: 'Tiga Perempat',
      targetAyat: p(0.75),
      percentage: 75,
      achieved: current >= p(0.75),
      icon: '✨',
    },
    {
      id: 'p90',
      label: 'Hampir Selesai',
      targetAyat: p(0.9),
      percentage: 90,
      achieved: current >= p(0.9),
      icon: '🎯',
    },
    {
      id: 'khatam',
      label: 'Khatam!',
      targetAyat: TOTAL_QURAN_AYAT,
      percentage: 100,
      achieved: current >= TOTAL_QURAN_AYAT,
      icon: '🎉',
    },
  ];
  return list;
}

export function getNextMilestone(totalAyatRead: number): Milestone | null {
  return getMilestones(totalAyatRead).find((m) => !m.achieved) || null;
}
