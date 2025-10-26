import { loadSurahMetadata, loadSurah } from '@/services/quran/quranData';

export type SurahHit = {
  number: number; // 1..114
  name: string;
  ayat_count: number;
};

export type AyatHit = {
  surah: number;
  ayat: number;
  snippet_ar?: string;
  snippet_id?: string;
};

export async function searchSurah(query: string): Promise<SurahHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const meta = await loadSurahMetadata();
  return meta
    .filter((m) => String(m.number) === q || (m.name || '').toLowerCase().includes(q))
    .slice(0, 30)
    .map((m) => ({ number: m.number, name: m.name, ayat_count: m.ayat_count }));
}

/**
 * Search inside a surah's text/translation. Lazy-load only that surah.
 */
export async function searchInSurah(
  surahNumber: number,
  query: string,
  lang: 'ar' | 'id' | 'both' = 'both'
): Promise<AyatHit[]> {
  const q = query.trim();
  if (!q) return [];

  const s = await loadSurah(surahNumber);
  const res: AyatHit[] = [];

  const qLower = q.toLowerCase();
  const isArabicQuery = /[\u0600-\u06FF]/.test(q);

  for (const a of s.ayat) {
    const ar = a.text || '';
    const id = a.translation || '';

    let match = false;
    if (lang === 'ar' || lang === 'both') {
      match ||= isArabicQuery ? ar.includes(q) : false;
    }
    if (lang === 'id' || lang === 'both') {
      match ||= id.toLowerCase().includes(qLower);
    }

    if (match) {
      res.push({
        surah: s.number,
        ayat: a.number,
        snippet_ar: ar.slice(0, 80),
        snippet_id: id.slice(0, 120),
      });
      if (res.length >= 50) break;
    }
  }
  return res;
}

/** Parse inputs like "2:255", "2.255", "255" (uses current), or "Al-Baqarah 255" */
export async function parseJumpInput(
  input: string,
  currentSurah?: number
): Promise<{ surah: number; ayat: number } | null> {
  const raw = input.trim();
  if (!raw) return null;

  // 1) pattern "S:A" or "S.A"
  const m = raw.match(/^\s*(\d{1,3})\s*[:\.]\s*(\d{1,3})\s*$/);
  if (m) return { surah: Number(m[1]), ayat: Number(m[2]) };

  // 2) just a number → ayat in current surah
  if (/^\d+$/.test(raw) && currentSurah) {
    return { surah: currentSurah, ayat: Number(raw) };
  }

  // 3) "al-baqarah 255" (prefix match)
  const meta = await loadSurahMetadata();
  const lower = raw.toLowerCase();
  const matchMeta = meta.find((s) => lower.startsWith((s.name || '').toLowerCase()));
  if (matchMeta) {
    const rest = raw.slice(String(matchMeta.name).length);
    const numMatch = rest.match(/\d+/);
    const ay = numMatch ? Number(numMatch[0]) : 1;
    return { surah: matchMeta.number, ayat: ay };
  }

  return null;
}
