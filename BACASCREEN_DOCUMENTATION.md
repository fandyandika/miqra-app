# 📖 BacaScreen Feature Documentation

## Overview

Tab "Baca" sebagai pusat aktivitas harian Miqra yang menyediakan akses mudah untuk membaca Qur'an dan mencatat bacaan manual.

## 🎯 Tujuan

- **Bisa Baca Langsung** - Akses Qur'an Reader untuk membaca digital
- **Bisa Catat Manual** - Log bacaan dari mushaf fisik
- **Banner Lanjutkan** - Menampilkan "Lanjutkan terakhir dibaca"
- **Integrasi Sistem** - Menyatu dengan sistem pahala & progress

## 📁 File Structure

```
src/features/baca/
├── BacaScreen.tsx              # Main screen component
├── components/
│   ├── ContinueBanner.tsx      # Banner untuk lanjutkan bacaan
│   ├── ActionButton.tsx        # Button untuk aksi utama
│   └── TodaySummary.tsx        # Ringkasan bacaan hari ini
├── hooks/
│   └── useContinueReading.ts   # Hook untuk bookmark bacaan
└── index.ts                    # Export semua komponen
```

## 🚀 Components

### 1. BacaScreen (Main Component)

**File**: `src/features/baca/BacaScreen.tsx`

**Features**:

- Header dengan title dan subtitle
- ContinueBanner (conditional)
- Dua ActionButton (Baca Langsung & Catat Manual)
- TodaySummary dengan statistik hari ini
- Motivational quote

**Navigation**:

- Continue → ReaderScreen dengan bookmark
- Baca Langsung → ReaderScreen
- Catat Manual → CatatBacaanScreen

### 2. useContinueReading Hook

**File**: `src/features/baca/hooks/useContinueReading.ts`

**Functionality**:

```typescript
export function useContinueReading(userId?: string) {
  const [bookmark, setBookmark] = useState<{
    surahNumber: number;
    ayatNumber: number;
    surahName: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // Loads bookmark from user_settings table
  // Returns bookmark data or null
}
```

**Data Source**:

- `user_settings.last_read_surah`
- `user_settings.last_read_ayat`
- `loadSurahCombined()` untuk nama surah

### 3. ContinueBanner Component

**File**: `src/features/baca/components/ContinueBanner.tsx`

**Props**:

```typescript
type ContinueBannerProps = {
  bookmark: {
    surahNumber: number;
    ayatNumber: number;
    surahName: string;
  };
  onContinue: () => void;
};
```

**UI Elements**:

- Book icon
- "Lanjutkan Bacaan" title
- Surah name dan ayat number
- Chevron arrow

### 4. ActionButton Component

**File**: `src/features/baca/components/ActionButton.tsx`

**Props**:

```typescript
type ActionButtonProps = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};
```

**Variants**:

- **Primary**: Green background, white text
- **Secondary**: White background, green text

**Usage**:

- **Baca Langsung**: Primary variant, book-open icon
- **Catat Manual**: Secondary variant, pencil icon

### 5. TodaySummary Component

**File**: `src/features/baca/components/TodaySummary.tsx`

**Props**:

```typescript
type TodaySummaryProps = {
  ayatRead: number;
  hasanatEarned: number;
  sessionsCount: number;
};
```

**UI Elements**:

- Calendar icon
- "Hari Ini" title
- Three stat columns dengan dividers
- Formatted numbers (Indonesian locale)

## 🔄 User Experience Flow

### Scenario 1: User dengan Bookmark

1. User membuka tab "Baca"
2. Melihat banner "Lanjutkan dari Al-Fatihah - Ayat 5"
3. Bisa tap untuk melanjutkan bacaan
4. Bisa juga pilih opsi lain

### Scenario 2: User Baru

1. User membuka tab "Baca"
2. Tidak ada banner bookmark
3. Bisa pilih "Baca Langsung" atau "Catat Manual"
4. Melihat ringkasan hari ini jika tersedia

## 📊 Data Integration

### Supabase Tables

- **user_settings**: Bookmark bacaan terakhir
- **reading_sessions**: Statistik bacaan harian
- **profiles**: Data user untuk hasanat

### Services Used

- `useContinueReading`: Load bookmark data
- `getDailyReadingStats`: Load statistik harian
- `loadSurahCombined`: Load nama surah
- `useAuth`: User authentication

### Real-time Updates

- Bookmark update otomatis saat user membaca
- Statistik update real-time
- Cache invalidation untuk data terbaru

## 🎨 UI Design

### Color Scheme

- **Primary**: Green (#00c896)
- **Primary Soft**: Light green background
- **Text**: Dark gray (#1A1A1A)
- **Neutral**: Medium gray
- **Background**: Light gray (#F8F9FA)

### Layout

- **Header**: Title + subtitle
- **Banner**: Conditional bookmark banner
- **Actions**: Two main action buttons
- **Summary**: Today's statistics
- **Quote**: Motivational Islamic quote

### Responsive Design

- ScrollView untuk konten panjang
- Consistent spacing (16px margins)
- Card-based design dengan shadows
- Touch-friendly button sizes

## 🧪 Testing

### Test Coverage

```
✅ useContinueReading Hook: Bookmark loading
✅ ContinueBanner: UI elements dan props
✅ ActionButton: Primary dan secondary variants
✅ TodaySummary: Statistik display
✅ BacaScreen: Integration dan navigation
✅ User Experience: Multiple scenarios
✅ Data Integration: Supabase services
```

### Test Results

```
✅ Hook structure: Correct
✅ Component props: All validated
✅ UI elements: All present
✅ Navigation: All routes working
✅ Data flow: Complete integration
✅ User scenarios: Both covered
```

## 📋 Acceptance Criteria

### ✅ #17F Requirements Met

- [x] **Bisa Baca Langsung** - ActionButton navigasi ke ReaderScreen
- [x] **Bisa Catat Manual** - ActionButton navigasi ke CatatBacaanScreen
- [x] **Banner Lanjutkan** - ContinueBanner dengan bookmark data
- [x] **Integrasi Sistem** - TodaySummary dengan hasanat & progress

## 🔧 Technical Implementation

### Navigation Integration

```typescript
// src/navigation/BottomTabs.tsx
<Tab.Screen
  name="Baca"
  component={BacaScreen}
  options={{
    tabBarLabel: 'Baca',
    tabBarIcon: 'book' as any,
  }}
/>
```

### Data Flow

1. **BacaScreen** loads
2. **useContinueReading** fetches bookmark
3. **getDailyReadingStats** fetches today's data
4. **Components** render with data
5. **User interactions** trigger navigation

### Error Handling

- Loading states untuk semua data
- Graceful fallback untuk missing data
- Error boundaries untuk component crashes
- Null checks untuk optional data

## 🚀 Future Enhancements

### Potential Improvements

1. **More Surahs**: Extend beyond Al-Fatihah
2. **Reading Streaks**: Show current streak
3. **Goals**: Daily reading goals
4. **Achievements**: Reading milestones
5. **Social**: Share reading progress

### Performance Optimizations

1. **Caching**: Cache surah data
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Optimize re-renders
4. **Bundle Splitting**: Code splitting

## 📝 Usage Examples

### Basic Usage

```typescript
import { BacaScreen } from '@/features/baca';

// In navigation
<Tab.Screen name="Baca" component={BacaScreen} />
```

### Custom Components

```typescript
import {
  ContinueBanner,
  ActionButton,
  TodaySummary,
  useContinueReading
} from '@/features/baca';

// Use individual components
<ContinueBanner bookmark={bookmark} onContinue={handleContinue} />
<ActionButton title="Baca" icon="book" onPress={handlePress} />
<TodaySummary ayatRead={25} hasanatEarned={2500} sessionsCount={3} />
```

## 🎉 Summary

BacaScreen menyediakan:

- **Centralized Access** - Satu tempat untuk semua aktivitas bacaan
- **Smart Bookmarks** - Lanjutkan dari bacaan terakhir
- **Dual Options** - Digital reading dan manual logging
- **Progress Integration** - Statistik dan hasanat terintegrasi
- **User-Friendly** - UI yang intuitif dan responsive

Tab "Baca" sekarang menjadi pusat aktivitas harian yang lengkap dan terintegrasi dengan sistem Miqra!
