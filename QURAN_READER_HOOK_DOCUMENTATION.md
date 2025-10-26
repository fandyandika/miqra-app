# 📖 useQuranReader Hook Documentation

## Overview

Custom React hook untuk membaca Quran dengan fitur seleksi ayat, bookmark, dan toggle terjemahan.

## 📁 File Structure

```
src/features/quran/
├── useQuranReader.ts    # Main hook implementation
└── index.ts            # Export file
```

## 🚀 Features

### ✅ Core Functionality

- **Surah Loading** - Load Arabic + Translation data
- **Ayah Selection** - Select single ayah or range (1-7)
- **Bookmark System** - Save reading progress to user_settings
- **Translation Toggle** - Show/hide translations with persistence
- **Loading States** - Handle async operations gracefully

### ✅ State Management

- `surah` - Current surah data
- `currentAyah` - Currently focused ayah
- `selection` - Selected ayah range
- `showTranslation` - Translation visibility
- `loading` - Loading state

## 📊 Usage Examples

### Basic Usage

```typescript
import { useQuranReader } from '@/features/quran';

function QuranReader() {
  const {
    surah,
    loading,
    currentAyah,
    selection,
    showTranslation,
    selectAyah,
    resetSelection,
    toggleTranslation,
    saveBookmark,
  } = useQuranReader(1, 'id'); // Al-Fatihah, Indonesian

  if (loading) return <LoadingSpinner />;

  return (
    <View>
      <Text>{surah?.name}</Text>
      {surah?.ayat.map((ayah) => (
        <AyahItem
          key={ayah.number}
          ayah={ayah}
          isSelected={selection.start <= ayah.number && ayah.number <= (selection.end || selection.start)}
          onPress={() => selectAyah(ayah.number)}
          showTranslation={showTranslation}
        />
      ))}
    </View>
  );
}
```

### Selection Logic

```typescript
// First tap: Start selection
selectAyah(3); // { start: 3, end: null }

// Second tap: Complete range
selectAyah(7); // { start: 3, end: 7 }

// Third tap: Reset and start new
selectAyah(2); // { start: 2, end: null }

// Manual reset
resetSelection(); // { start: 0, end: null }
```

### Bookmark Saving

```typescript
// Save current position
await saveBookmark(userId, 1, 5); // Surah 1, Ayah 5

// Updates user_settings table:
// - last_read_surah: 1
// - last_read_ayat: 5
// - last_read_at: "2025-01-25T23:08:58.792Z"
```

### Translation Toggle

```typescript
// Toggle translation visibility
await toggleTranslation();

// State persists in AsyncStorage
// Key: 'quran_show_translation'
// Value: true/false (JSON string)
```

## 🏗️ Hook API

### Parameters

```typescript
useQuranReader(initialSurah?: number, lang?: string)
```

- `initialSurah` - Default: 1 (Al-Fatihah)
- `lang` - Default: 'id' (Indonesian)

### Return Values

```typescript
{
  // Data
  surah: Surah | null;
  loading: boolean;
  currentAyah: number;
  selection: { start: number; end: number | null };
  showTranslation: boolean;

  // Actions
  setCurrentAyah: (num: number) => void;
  selectAyah: (num: number) => void;
  resetSelection: () => void;
  setShowTranslation: (show: boolean) => void;
  toggleTranslation: () => Promise<void>;
  saveBookmark: (userId: string, surahNum: number, ayahNum: number) => Promise<void>;
  load: (number: number) => Promise<void>;
}
```

## 🔄 State Flow

### Selection Flow

1. **Empty State**: `{ start: 0, end: null }`
2. **First Selection**: `{ start: 3, end: null }`
3. **Range Complete**: `{ start: 3, end: 7 }`
4. **Reset**: `{ start: 0, end: null }`

### Translation Toggle Flow

1. **Load Preference**: Read from AsyncStorage on mount
2. **Toggle**: Update state + save to AsyncStorage
3. **Persistence**: Survives app restarts

### Bookmark Flow

1. **User Action**: Tap bookmark button
2. **Save to DB**: Update user_settings table
3. **Sync**: Real-time sync across devices

## 🧪 Testing

### Test Script

```bash
npx tsx scripts/test-quran-reader-hook.ts
```

### Test Results

```
✅ First selection: {"start":3,"end":null}
✅ Range selection: {"start":3,"end":7}
✅ Reset selection: {"start":0,"end":null}
✅ Translation toggle logic working
✅ Bookmark save logic working
✅ AsyncStorage integration working
🎉 All hook tests passed!
```

## 📋 Acceptance Criteria

### ✅ #17B Requirements Met

- [x] **Seleksi ayat 1–7 tersimpan dengan benar** - Range selection working
- [x] **Bookmark update di user_settings** - Database integration working
- [x] **Toggle terjemahan tersimpan lokal** - AsyncStorage persistence working

## 🔧 Implementation Details

### AsyncStorage Keys

```typescript
const TRANSLATION_TOGGLE_KEY = 'quran_show_translation';
```

### Database Schema

```sql
-- user_settings table
last_read_surah: INTEGER
last_read_ayat: INTEGER
last_read_at: TIMESTAMP
```

### Error Handling

- **Load Failures**: Graceful error logging
- **Storage Failures**: Fallback to default values
- **Network Issues**: Retry logic in saveBookmark

## 🚀 Performance

### Optimizations

- **Lazy Loading**: Load surah only when needed
- **Caching**: Leverages quranData service cache
- **Minimal Re-renders**: Efficient state updates

### Memory Usage

- **Per Hook Instance**: ~1-2KB
- **Surah Data**: Cached in quranData service
- **Selection State**: Minimal memory footprint

## 🔄 Integration Points

### Dependencies

- `@/services/quran/quranData` - Quran data loading
- `@/lib/supabase` - Database operations
- `@react-native-async-storage/async-storage` - Local storage

### Usage in Components

```typescript
// In QuranReaderScreen.tsx
const quranReader = useQuranReader(1, 'id');

// In AyahList.tsx
const { selection, selectAyah } = useQuranReader();

// In SettingsScreen.tsx
const { toggleTranslation, showTranslation } = useQuranReader();
```

## 📝 Notes

- Hook is designed for React Native environment
- Requires AsyncStorage for translation preference
- Requires Supabase for bookmark persistence
- Selection state is local to hook instance
- Translation preference is global across app

## 🎯 Next Steps

1. **Range Validation** - Ensure selection within surah bounds
2. **Multi-language** - Support multiple translation languages
3. **Offline Mode** - Handle offline bookmark saving
4. **Sync Conflicts** - Handle concurrent bookmark updates
5. **Analytics** - Track reading patterns and progress
