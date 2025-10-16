import { format, parseISO } from 'date-fns';

export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}


