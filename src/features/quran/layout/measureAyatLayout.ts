import RNTextSize, { TSFontSpecs } from 'react-native-text-size';
import { PixelRatio, Platform } from 'react-native';

export type Item = {
  text: string;
  translation?: string;
  surahNumber?: number;
  number: number;
};

type Key = string;

const cache = new Map<
  Key,
  { lengths: number[]; offsets: number[]; indexMap: Record<string, number> }
>();

export async function buildLayoutExact(
  items: Item[],
  opts: {
    isJuz: boolean;
    surahNumber: number;
    showTranslation: boolean;
    width: number;
    headerHeight: number;
    arabic: TSFontSpecs;
    trans: TSFontSpecs;
    row: { padV: number; padH: number; borderBottom: number };
    cacheKey: Key;
  }
) {
  const { isJuz, surahNumber, showTranslation, width, headerHeight, arabic, trans, row, cacheKey } =
    opts;

  const borderPx =
    Platform.OS === 'ios' ? row.borderBottom : PixelRatio.roundToNearestPixel(row.borderBottom);

  const fullKey = `${cacheKey}|w=${width}|hH=${headerHeight}|a=${arabic.fontSize}-${arabic.lineHeight}|t=${
    showTranslation ? `${trans.fontSize}-${trans.lineHeight}` : '0'
  }`;

  const cached = cache.get(fullKey);
  if (cached) return cached;

  const aHeights = await Promise.all(
    items.map((it) =>
      RNTextSize.measure({ text: String(it.text ?? ''), width, ...arabic }).then((b) =>
        Math.ceil(b.height)
      )
    )
  );

  const tHeights = showTranslation
    ? await Promise.all(
        items.map((it) =>
          RNTextSize.measure({ text: String(it.translation ?? ''), width, ...trans }).then((b) =>
            Math.ceil(b.height)
          )
        )
      )
    : items.map(() => 0);

  const lengths: number[] = new Array(items.length);
  const offsets: number[] = new Array(items.length);

  let acc = Math.ceil(headerHeight);
  for (let i = 0; i < items.length; i++) {
    const h = Math.ceil(row.padV * 2 + aHeights[i] + tHeights[i] + borderPx);
    lengths[i] = h;
    offsets[i] = acc;
    acc += h;
  }

  const indexMap: Record<string, number> = {};
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = isJuz ? Number(it.surahNumber) : surahNumber;
    indexMap[`${s}:${Number(it.number)}`] = i;
  }

  const result = { lengths, offsets, indexMap };
  cache.set(fullKey, result);
  return result;
}

export function canMeasureText(): boolean {
  // @ts-expect-error - react-native-text-size has no default export type
  return !!(RNTextSize && (RNTextSize as any).measure);
}
