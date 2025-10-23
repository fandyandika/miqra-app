import { getTodayDate } from './time';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Check if a date string represents "today" in the user's timezone
 * This ensures cross-day consistency when the app is opened on different days
 */
export function isTodayInUserTimezone(
  dateStr: string,
  userTimezone: string = 'Asia/Jakarta'
): boolean {
  try {
    const today = new Date();
    const userToday = toZonedTime(today, userTimezone);
    const checkDate = new Date(dateStr);
    const userCheckDate = toZonedTime(checkDate, userTimezone);

    return isSameDay(userToday, userCheckDate);
  } catch (error) {
    console.error(
      '[CrossDayConsistency] Error checking if date is today:',
      error
    );
    return false;
  }
}

/**
 * Get the start of today in user timezone
 */
export function getTodayStartInUserTimezone(
  userTimezone: string = 'Asia/Jakarta'
): Date {
  const today = new Date();
  const userToday = toZonedTime(today, userTimezone);
  return new Date(
    userToday.getFullYear(),
    userToday.getMonth(),
    userToday.getDate()
  );
}

/**
 * Get the end of today in user timezone
 */
export function getTodayEndInUserTimezone(
  userTimezone: string = 'Asia/Jakarta'
): Date {
  const today = new Date();
  const userToday = toZonedTime(today, userTimezone);
  return new Date(
    userToday.getFullYear(),
    userToday.getMonth(),
    userToday.getDate(),
    23,
    59,
    59,
    999
  );
}

/**
 * Check if a streak should be maintained based on cross-day consistency
 * This prevents streak breaks when the app is opened on different days
 */
export function shouldMaintainStreak(
  lastCheckinDate: string | null,
  currentStreak: number,
  userTimezone: string = 'Asia/Jakarta'
): { shouldMaintain: boolean; reason: string } {
  if (!lastCheckinDate) {
    return { shouldMaintain: false, reason: 'No previous checkin' };
  }

  const today = new Date();
  const userToday = toZonedTime(today, userTimezone);
  const lastCheckin = new Date(lastCheckinDate);
  const userLastCheckin = toZonedTime(lastCheckin, userTimezone);

  // If last checkin was today, maintain streak
  if (isSameDay(userToday, userLastCheckin)) {
    return { shouldMaintain: true, reason: 'Checked in today' };
  }

  // If last checkin was yesterday, maintain streak
  const yesterday = subDays(userToday, 1);
  if (isSameDay(yesterday, userLastCheckin)) {
    return {
      shouldMaintain: true,
      reason: 'Checked in yesterday, streak continues',
    };
  }

  // If last checkin was more than 1 day ago, break streak
  const daysDiff = Math.floor(
    (userToday.getTime() - userLastCheckin.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff > 1) {
    return {
      shouldMaintain: false,
      reason: `Last checkin was ${daysDiff} days ago`,
    };
  }

  return { shouldMaintain: true, reason: 'Within acceptable range' };
}

/**
 * Get the appropriate tree growth level based on streak and cross-day consistency
 */
export function getTreeGrowthLevel(
  currentStreak: number,
  lastCheckinDate: string | null,
  userTimezone: string = 'Asia/Jakarta'
): {
  level: number;
  description: string;
  shouldGrow: boolean;
  shouldMaintain: boolean;
} {
  const { shouldMaintain } = shouldMaintainStreak(
    lastCheckinDate,
    currentStreak,
    userTimezone
  );

  if (!shouldMaintain) {
    return {
      level: 0,
      description: 'Seed',
      shouldGrow: false,
      shouldMaintain: false,
    };
  }

  if (currentStreak === 0) {
    return { level: 0, description: 'Seed', shouldGrow: false, shouldMaintain };
  } else if (currentStreak < 3) {
    return {
      level: 1,
      description: 'Sprout',
      shouldGrow: currentStreak === 1,
      shouldMaintain,
    };
  } else if (currentStreak < 7) {
    return {
      level: 2,
      description: 'Sapling',
      shouldGrow: currentStreak === 3,
      shouldMaintain,
    };
  } else if (currentStreak < 14) {
    return {
      level: 3,
      description: 'Young Tree',
      shouldGrow: currentStreak === 7,
      shouldMaintain,
    };
  } else if (currentStreak < 30) {
    return {
      level: 4,
      description: 'Mature Tree',
      shouldGrow: currentStreak === 14,
      shouldMaintain,
    };
  } else if (currentStreak < 100) {
    return {
      level: 5,
      description: 'Ancient Tree',
      shouldGrow: currentStreak === 30,
      shouldMaintain,
    };
  } else {
    return {
      level: 6,
      description: 'Legendary Tree',
      shouldGrow: currentStreak === 100,
      shouldMaintain,
    };
  }
}
