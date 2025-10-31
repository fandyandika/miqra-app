import { Ayah, loadSurahMetadata, loadSurahCombined } from './quranData';
import { getPageForAyah, getJuzForAyah } from './pageMap';

export interface JuzBoundary {
  juzNumber: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export interface AyahWithSurahInfo extends Ayah {
  surahNumber?: number;
  surahName?: string;
  surahNameAr?: string;
  surahMeaning?: string;
  surahTotalAyahs?: number;
  isSurahStart?: boolean;
  isFirstAyahOfSurah?: boolean; // True if this ayah is actually ayah #1 of the surah
  page?: number;
  juz?: number;
}

// Load Juz boundaries from JSON source to avoid name mismatches
type JuzJson = {
  index: string; // '01'..'30'
  start: { index: string; verse: string; name: string };
  end: { index: string; verse: string; name: string };
}[];

function parseSurahIndex(indexStr: string): number {
  // e.g. '046' -> 46
  const n = parseInt(indexStr, 10);
  return Number.isFinite(n) ? n : 1;
}

function parseVerseNumber(verseKey: string): number {
  // e.g. 'verse_31' -> 31
  const match = /verse_(\d+)/.exec(verseKey);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Get Juz boundary information
 */
export async function getJuzBoundary(juzNumber: number): Promise<JuzBoundary> {
  const juzList: JuzJson = require('../../../assets/quran/metadata/juz.json');
  const juz = juzList.find((j) => parseInt(j.index, 10) === juzNumber);
  if (!juz) {
    throw new Error(`Juz ${juzNumber} not found`);
  }

  // Parse start
  const startSurah = parseSurahIndex(juz.start.index);
  const startAyah = parseVerseNumber(juz.start.verse);

  // Determine end point - End is defined in the same JSON entry
  const endSurah = parseSurahIndex(juz.end.index);
  const endAyah = parseVerseNumber(juz.end.verse);

  return {
    juzNumber,
    startSurah,
    startAyah,
    endSurah,
    endAyah,
  };
}

/**
 * Load Juz content - combines multiple surahs/ayat into one continuous reading
 */
export async function loadJuzContent(juzNumber: number): Promise<AyahWithSurahInfo[]> {
  const boundary = await getJuzBoundary(juzNumber);
  const metadata = await loadSurahMetadata();

  const allAyat: AyahWithSurahInfo[] = [];

  // If Juz starts and ends in the same surah
  if (boundary.startSurah === boundary.endSurah) {
    const surah = await loadSurahCombined(boundary.startSurah);
    const meta = metadata.find((m) => m.number === boundary.startSurah);
    const startIndex = boundary.startAyah - 1;
    const endIndex = boundary.endAyah;
    const juzAyat = surah.ayat.slice(startIndex, endIndex);

    allAyat.push(
      ...juzAyat.map((ayah, idx) => {
        const page = getPageForAyah(boundary.startSurah, ayah.number);
        const juz = getJuzForAyah(boundary.startSurah, ayah.number);
        return {
          ...ayah,
          surahNumber: boundary.startSurah,
          surahName: meta?.name_id || surah.name,
          surahNameAr: meta?.name_ar,
          surahMeaning: meta?.name_translation,
          surahTotalAyahs: meta?.ayat_count,
          isSurahStart: idx === 0,
          isFirstAyahOfSurah: ayah.number === 1,
          page,
          juz,
        };
      })
    );
  } else {
    // Juz spans multiple surahs
    let isFirstSurah = true;

    for (let surahNum = boundary.startSurah; surahNum <= boundary.endSurah; surahNum++) {
      const surah = await loadSurahCombined(surahNum);
      const meta = metadata.find((m) => m.number === surahNum);

      let startIndex = 0;
      let endIndex = surah.ayat.length;

      if (surahNum === boundary.startSurah) {
        // First surah - start from the specified ayah
        startIndex = boundary.startAyah - 1;
      }

      if (surahNum === boundary.endSurah) {
        // Last surah - end at the specified ayah
        endIndex = boundary.endAyah;
      }

      const surahAyat = surah.ayat.slice(startIndex, endIndex);
      const isNewSurah = isFirstSurah || surahNum === boundary.startSurah;

      allAyat.push(
        ...surahAyat.map((ayah, idx) => {
          const page = getPageForAyah(surahNum, ayah.number);
          const juz = getJuzForAyah(surahNum, ayah.number);
          return {
            ...ayah,
            surahNumber: surahNum,
            surahName: meta?.name_id || surah.name,
            surahNameAr: meta?.name_ar,
            surahMeaning: meta?.name_translation,
            surahTotalAyahs: meta?.ayat_count,
            isSurahStart: idx === 0,
            isFirstAyahOfSurah: ayah.number === 1,
            page,
            juz,
          };
        })
      );

      isFirstSurah = false;
    }
  }

  return allAyat;
}

/**
 * Get Juz title for display
 */
export async function getJuzTitle(juzNumber: number): Promise<string> {
  return `Juz ${juzNumber}`;
}
