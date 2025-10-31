import { ruleColors } from '@/constants/ruleColors';
import { ruleColorsDark } from '@/constants/ruleColorsDark';

export type TajweedRange = { start: number; end: number; rule: string };
type TajweedVerseMap = Record<string, TajweedRange[]>;
export interface TajweedFile {
  index: string;
  verse: TajweedVerseMap;
  count: number;
}

const cache = new Map<number, TajweedFile>();
import { tajweedIndex } from './tajweedIndex';

export function loadTajweedSync(surahNumber: number): TajweedFile | null {
  const data = tajweedIndex[surahNumber];
  if (data) {
    cache.set(surahNumber, data as TajweedFile);
    return data as TajweedFile;
  }
  return null;
}

export function getAyahTajweedRanges(surahNumber: number, ayahNumber: number): TajweedRange[] {
  const file = cache.get(surahNumber) || loadTajweedSync(surahNumber);
  if (!file || !file.verse) return [];
  return file.verse[`verse_${ayahNumber}`] || [];
}

export function buildTajweedSegments(
  text: string,
  ranges: TajweedRange[],
  isDarkMode: boolean
): Array<{ text: string; style?: any }> {
  if (!text || !ranges?.length) return [{ text }];
  const segs: Array<{ text: string; style?: any }> = [];
  const colors = isDarkMode ? ruleColorsDark : ruleColors;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const r of sorted) {
    const start = Math.max(0, Math.min(text.length, r.start));
    const end = Math.max(0, Math.min(text.length, r.end));
    if (start > cursor) segs.push({ text: text.slice(cursor, start) });
    if (end > start) {
      const color = colors[r.rule] ?? colors.unknown;
      segs.push({ text: text.slice(start, end), style: { color } });
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < text.length) segs.push({ text: text.slice(cursor) });
  return segs;
}


