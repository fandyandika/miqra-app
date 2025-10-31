// Lightweight service to load and query Mushaf page/juz per ayah

type PageMapEntry = {
  surah: number;
  ayah: number;
  page: number;
  juz: number;
};

let loaded = false;
let ayahKeyToPage: Map<string, number> | null = null;
let ayahKeyToJuz: Map<string, number> | null = null;
let pageToAyahRanges: Map<number, { surah: number; ayah: number }[]> | null = null;

function makeKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function ensureLoaded() {
  if (loaded) return;
  const data: PageMapEntry[] = require('../../../assets/quran/metadata/page_map.json');

  ayahKeyToPage = new Map();
  ayahKeyToJuz = new Map();
  pageToAyahRanges = new Map();

  for (const row of data) {
    if (
      !row ||
      typeof row.surah !== 'number' ||
      typeof row.ayah !== 'number' ||
      typeof row.page !== 'number' ||
      typeof row.juz !== 'number'
    ) {
      continue;
    }
    const key = makeKey(row.surah, row.ayah);
    ayahKeyToPage.set(key, row.page);
    ayahKeyToJuz.set(key, row.juz);

    const list = pageToAyahRanges.get(row.page) || [];
    list.push({ surah: row.surah, ayah: row.ayah });
    pageToAyahRanges.set(row.page, list);
  }

  // Sort each page's ayah list for deterministic ordering
  for (const [p, list] of pageToAyahRanges.entries()) {
    list.sort((a, b) => (a.surah === b.surah ? a.ayah - b.ayah : a.surah - b.surah));
    pageToAyahRanges.set(p, list);
  }

  loaded = true;
}

export function getPageForAyah(surah: number, ayah: number): number | undefined {
  ensureLoaded();
  const page = ayahKeyToPage?.get(makeKey(surah, ayah));
  return typeof page === 'number' ? page : undefined;
}

export function getJuzForAyah(surah: number, ayah: number): number | undefined {
  ensureLoaded();
  const juz = ayahKeyToJuz?.get(makeKey(surah, ayah));
  return typeof juz === 'number' ? juz : undefined;
}

export function getAyahsForPage(page: number): { surah: number; ayah: number }[] {
  ensureLoaded();
  return [...(pageToAyahRanges?.get(page) || [])];
}

export function getPagesForJuz(juz: number): number[] {
  ensureLoaded();
  const pages = new Set<number>();
  for (const [key, j] of ayahKeyToJuz || []) {
    if (j === juz) {
      const page = ayahKeyToPage?.get(key);
      if (typeof page === 'number') pages.add(page);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function getJuzStartAyah(juz: number): { surah: number; ayah: number } | null {
  ensureLoaded();
  let best: { surah: number; ayah: number; page: number } | null = null;
  for (const [key, j] of ayahKeyToJuz || []) {
    if (j !== juz) continue;
    const page = ayahKeyToPage?.get(key);
    if (typeof page !== 'number') continue;
    const [sStr, aStr] = key.split(':');
    const s = parseInt(sStr, 10);
    const a = parseInt(aStr, 10);
    if (
      !best ||
      page < best.page ||
      (page === best.page && (s < best.surah || (s === best.surah && a < best.ayah)))
    ) {
      best = { surah: s, ayah: a, page };
    }
  }
  return best ? { surah: best.surah, ayah: best.ayah } : null;
}
