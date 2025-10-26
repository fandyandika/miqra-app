import letterCounts from '@/data/letter-counts.json';

/**
 * Calculate letters & hasanat between ayat range
 */
export async function calculateHasanat(surah: number, start: number, end: number) {
  let letters = 0;
  for (let i = start; i <= end; i++) {
    const key = `${surah}:${i}`;
    const count = letterCounts.data[key] || 0;
    letters += count;
  }
  return letters;
}
