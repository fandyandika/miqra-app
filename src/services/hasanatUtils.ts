import { supabase } from '@/lib/supabase';
import letterCountsData from '@/data/letter-counts-precise.json';

export interface HasanatCalculation {
  totalLetters: number;
  totalHasanat: number;
  ayatCount: number;
}

export async function calculateSelectionHasanat(
  surahNumber: number,
  startAyat: number,
  endAyat: number
): Promise<HasanatCalculation> {
  try {
    console.log('[hasanat] Calculating for:', { surahNumber, startAyat, endAyat });

    // Use corrected JSON data (basmalah already subtracted from ayat 1)
    const data = letterCountsData.data as Record<string, number>;
    let totalLetters = 0;

    for (let ayah = startAyat; ayah <= endAyat; ayah++) {
      const key = `${surahNumber}:${ayah}`;
      const letters = data[key] || 0;

      console.log(`[hasanat] Ayah ${surahNumber}:${ayah} = ${letters} letters`);
      totalLetters += letters;
    }

    const totalHasanat = totalLetters * 10;
    const ayatCount = endAyat - startAyat + 1;

    console.log('[hasanat] Final calculation:', { totalLetters, totalHasanat, ayatCount });

    return { totalLetters, totalHasanat, ayatCount };
  } catch (error) {
    console.error('Error calculating hasanat:', error);
    // Fallback estimation
    const ayatCount = endAyat - startAyat + 1;
    const estimatedLetters = ayatCount * 25; // rough average
    return {
      totalLetters: estimatedLetters,
      totalHasanat: estimatedLetters * 10,
      ayatCount,
    };
  }
}
