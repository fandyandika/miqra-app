# Verifikasi Font UthmanicHafs

## Status: ✅ SUDAH TERPASANG DAN DIGUNAKAN

### 1. Font Loading (App.tsx:159)
```typescript
UthmanicHafs: require('./assets/fonts/UthmanicHafs_V22.ttf')
```

### 2. Font Usage
- **ReaderScreen.tsx**: 4 tempat
  - Layout measurement (line 362)
  - Layout measurement (line 871)
  - Styles.arabic (line 1582)
  - Styles.ayahNumberInline (line 1590)

- **AyahReader.tsx**: 2 tempat
  - Styles.arabic (line 170)
  - Styles.ayahNumberInline (line 176)

### 3. Data Source
- Semua import surah sudah diarahkan ke `qpc-converted/`
- QPC menggunakan Uthmanic script

## Troubleshooting

Jika font masih tidak muncul:

1. **Clear cache dan rebuild:**
   ```bash
   npx expo start -c
   ```

2. **Untuk development build:**
   ```bash
   # Android
   npx expo run:android --clear

   # iOS
   npx expo run:ios --clear
   ```

3. **Cek console log:**
   Setelah rebuild, lihat console untuk:
   ```
   [App] Fonts loaded: { fontsLoaded: true }
   [App] UthmanicHafs font should be available
   ```

4. **Verify font file:**
   - Path: `assets/fonts/UthmanicHafs_V22.ttf`
   - File size: ~2.4MB
   - Format: TrueType Font (TTF)

