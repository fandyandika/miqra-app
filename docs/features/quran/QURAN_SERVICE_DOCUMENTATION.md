# 📖 Quran Data Service Documentation

## Overview

Service untuk load, merge, dan cache data Quran (Arabic + Translation) dengan performa optimal.

## 📁 File Structure

```
src/services/quran/
├── quranData.ts     # Main service functions
└── index.ts         # Export file

assets/quran/
├── ar/              # Arabic text files
│   └── surah_001.json
└── id/              # Indonesian translation files
    └── surah_001.id.json
```

## 🚀 Features

### ✅ Core Functions

- **`loadSurahCombined(number, lang)`** - Load Arabic + Translation merged
- **`loadSurahArabic(number)`** - Load Arabic text only
- **`loadSurahTranslation(number, lang)`** - Load translation only
- **`clearQuranCache()`** - Clear all cached data

### ✅ Performance Features

- **AsyncStorage Caching** - Sub-30ms load times after first load
- **Error Handling** - Graceful fallback for missing translations
- **Type Safety** - Full TypeScript support

## 📊 Usage Examples

### Basic Usage

```typescript
import { loadSurahCombined } from '@/services/quran';

// Load Al-Fatihah with Indonesian translation
const surah = await loadSurahCombined(1, 'id');
console.log(surah.name); // "Al-Fatihah"
console.log(surah.ayat[0].text); // Arabic text
console.log(surah.ayat[0].translation); // Indonesian translation
```

### Cache Management

```typescript
import { clearQuranCache } from '@/services/quran';

// Clear all cached Quran data
await clearQuranCache();
```

### Error Handling

```typescript
try {
  const surah = await loadSurahCombined(1, 'id');
} catch (error) {
  if (error.message.includes('Missing Arabic surah data')) {
    // Handle missing Arabic file
  }
}
```

## 🏗️ Data Structure

### Ayah Type

```typescript
type Ayah = {
  number: number; // Ayah number (1-7 for Al-Fatihah)
  text: string; // Arabic text
  translation?: string; // Translation (empty string if missing)
};
```

### Surah Type

```typescript
type Surah = {
  number: number; // Surah number (1-114)
  name: string; // Surah name
  ayat_count: number; // Total ayat count
  ayat: Ayah[]; // Array of ayat
  source?: {
    // Metadata
    dataset: string;
    version: string;
  };
};
```

## 📁 File Format

### Arabic Files (`ar/surah_001.json`)

```json
{
  "number": 1,
  "name": "Al-Fatihah",
  "ayat_count": 7,
  "ayat": [
    {
      "number": 1,
      "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
    }
  ],
  "source": {
    "dataset": "quran-arabic",
    "version": "1.0"
  }
}
```

### Translation Files (`id/surah_001.id.json`)

```json
{
  "number": 1,
  "name": "Al-Fatihah",
  "ayat_count": 7,
  "ayat": [
    {
      "number": 1,
      "translation": "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
    }
  ],
  "source": {
    "dataset": "quran-translation-id",
    "version": "1.0"
  }
}
```

## ⚡ Performance

### Cache Performance

- **First Load**: ~5-50ms (depending on file size)
- **Cached Load**: <30ms (target achieved ✅)
- **Cache Key**: `quran_surah_v1_{number}_{lang}`

### Memory Usage

- **Per Surah**: ~2-10KB (depending on ayat count)
- **Cache Limit**: No automatic limit (manual clear only)

## 🛠️ Error Handling

### Missing Arabic File

```typescript
// Throws: "Missing Arabic surah data"
await loadSurahCombined(999);
```

### Missing Translation File

```typescript
// Returns surah with empty translations
const surah = await loadSurahCombined(1, 'missing');
console.log(surah.ayat[0].translation); // ""
```

## 🧪 Testing

### Test Scripts

```bash
# Create sample data
npx tsx scripts/create-sample-quran-data.ts

# Test basic functionality
npx tsx scripts/test-quran-basic.ts

# Test with AsyncStorage (requires RN environment)
npx tsx scripts/test-quran-service.ts
```

### Test Results

```
✅ Loaded in 5ms
📖 Surah: Al-Fatihah (7 ayat)
🔤 First ayah: بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ...
📝 Translation: Dengan nama Allah Yang Maha Pengasih, Maha Penyaya...
✅ Fallback translation: "empty"
✅ Correctly handled missing surah error
🎉 All tests passed!
```

## 📋 Acceptance Criteria

### ✅ #17A Requirements Met

- [x] `loadSurahCombined(1)` menghasilkan seluruh ayat + terjemahan
- [x] Cache aktif (load kedua <30ms)
- [x] Tidak error saat file translation hilang (fallback empty string)

## 🔧 Configuration

### Cache Settings

```typescript
const CACHE_PREFIX = 'quran_surah_v1_';
```

### Default Language

```typescript
// Default to Indonesian
loadSurahCombined(1); // Same as loadSurahCombined(1, 'id')
```

## 🚀 Next Steps

1. **Add More Languages** - Support for English, Arabic, etc.
2. **Batch Loading** - Load multiple surahs at once
3. **Progressive Loading** - Load ayat on-demand
4. **Offline Support** - Download all data for offline use

## 📝 Notes

- Files must follow naming convention: `surah_{number}.json` and `surah_{number}.{lang}.json`
- Arabic files are required, translations are optional
- Cache persists across app restarts
- Service is designed for React Native with AsyncStorage
