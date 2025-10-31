# 🔧 Bottom Navigation "Baca" Tab Fix

## Problem

Tab "Baca" tidak muncul di bottom navigation meskipun sudah dikonfigurasi.

## Root Cause

ReaderScreen tidak di-export dari `src/features/quran/index.ts`, sehingga import di BottomTabs tidak bisa menemukan komponen.

## Solution

### 1. Added ReaderScreen Export

```typescript
// src/features/quran/index.ts
export { useQuranReader } from './useQuranReader';
export { default as ReaderScreen } from './ReaderScreen'; // ← Added this
```

### 2. Updated Import in BottomTabs

```typescript
// src/navigation/BottomTabs.tsx
import { ReaderScreen } from '@/features/quran'; // ← Updated import
```

### 3. Tab Configuration (Already Correct)

```typescript
<Tab.Screen
  name="Reader"
  component={ReaderScreen}
  options={{
    tabBarLabel: 'Baca',
    tabBarIcon: 'book' as any,
  }}
/>
```

## Verification

### ✅ Tab Structure

```
[Home] [Progress] [Baca] [Family] [Profile]
  ↓       ↓        ↓       ↓        ↓
home-  chart-    book   account- account-
variant  bar            group    circle
```

### ✅ Configuration Check

- **Name**: Reader
- **Label**: Baca
- **Icon**: book
- **Component**: ReaderScreen
- **Import**: @/features/quran
- **Export**: src/features/quran/index.ts

### ✅ Test Results

```
✅ Baca tab found: Reader → Baca
✅ Component: ReaderScreen
✅ Icon: book
✅ Import: @/features/quran
✅ Export: src/features/quran/index.ts
```

## Files Modified

1. `src/features/quran/index.ts` - Added ReaderScreen export
2. `src/navigation/BottomTabs.tsx` - Updated import path

## Next Steps

If tab is still not visible:

1. **Restart Metro Bundler**:

   ```bash
   npx expo start --clear
   ```

2. **Clear App Cache**:
   - Reload app in Expo Go
   - Or restart Expo Go app

3. **Check Console**:
   - Look for any import errors
   - Check for component errors

## Status

✅ **Export Fixed** - ReaderScreen properly exported
✅ **Import Fixed** - BottomTabs imports from correct path
✅ **Configuration Correct** - Tab settings are proper
✅ **Ready to Test** - Should be visible after restart

The "Baca" tab should now be visible in the bottom navigation!
