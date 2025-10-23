import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function getTodayDate(timezone: string = 'Asia/Jakarta'): string {
  const now = new Date();
  const userNow = toZonedTime(now, timezone);
  return format(userNow, 'yyyy-MM-dd');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
