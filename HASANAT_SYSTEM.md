# 🌟 Hasanat System

Sistem Hasanat untuk aplikasi Miqra yang menghitung dan menyimpan hasanat berdasarkan huruf yang dibaca dari Al-Quran.

## 📋 Overview

Sistem ini menghitung hasanat berdasarkan hadits:

> "Barangsiapa yang membaca satu huruf dari Kitab Allah, maka baginya satu kebaikan, dan satu kebaikan itu akan dilipatgandakan menjadi sepuluh kebaikan." (HR. Tirmidzi)

**Formula**: 1 huruf = 10 hasanat

## 🗄️ Database Schema

### 1. `letter_counts` Table

Menyimpan jumlah huruf per ayat Al-Quran.

```sql
CREATE TABLE letter_counts (
  surah INT NOT NULL,
  ayah INT NOT NULL,
  letters INT NOT NULL,
  PRIMARY KEY (surah, ayah)
);
```

### 2. `reading_sessions` Table (Updated)

Ditambahkan kolom untuk hasanat:

```sql
ALTER TABLE reading_sessions
ADD COLUMN letter_count INT DEFAULT 0,
ADD COLUMN hasanat_earned INT DEFAULT 0;
```

### 3. `daily_hasanat` Table

Agregasi harian hasanat per user:

```sql
CREATE TABLE daily_hasanat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  total_letters INT NOT NULL DEFAULT 0,
  total_hasanat INT NOT NULL DEFAULT 0,
  session_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);
```

## ⚙️ Functions & Triggers

### 1. `sum_letters(surah, start, end)`

Menghitung total huruf untuk range ayat tertentu.

### 2. `tg_set_session_hasanat()`

Trigger BEFORE INSERT/UPDATE yang otomatis menghitung:

- `letter_count` = total huruf dalam range ayat
- `hasanat_earned` = letter_count × 10

### 3. `tg_update_daily_hasanat()`

Trigger AFTER INSERT/UPDATE/DELETE yang otomatis:

- Recalculate `daily_hasanat` untuk tanggal yang terpengaruh
- Update agregasi harian (total_letters, total_hasanat, session_count)

### 4. `recompute_daily_hasanat_row(user_id, date)`

Helper function untuk recalculate daily hasanat untuk user dan tanggal tertentu.

## 🚀 Setup Instructions

### 1. Apply Migrations

```bash
# Apply hasanat system migration
supabase migration up

# Or apply specific migration
supabase db push --include-all
```

### 2. Seed Letter Counts

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run seed script
npx ts-node scripts/seed_letter_counts.ts
```

### 3. Backfill Existing Data

```bash
# Run backfill script
npx ts-node scripts/setup-hasanat.ts
```

## 📱 Frontend Integration

### 1. Hasanat Service

```typescript
import { getHasanatStats, getHasanatLeaderboard } from '@/services/hasanat';

// Get personal stats
const stats = await getHasanatStats();

// Get family leaderboard
const leaderboard = await getHasanatLeaderboard(familyId);
```

### 2. Hasanat Components

```typescript
import { HasanatCard, HasanatLeaderboard } from '@/components/hasanat';

// Display hasanat stats
<HasanatCard
  totalHasanat={stats.total_hasanat}
  totalLetters={stats.total_letters}
  streakDays={stats.streak_days}
  dailyAverage={stats.daily_average}
/>

// Display family leaderboard
<HasanatLeaderboard
  personal={leaderboard.personal}
  family={leaderboard.family}
/>
```

### 3. Real-time Updates

Sistem otomatis update hasanat ketika:

- User menambah reading session baru
- User mengupdate reading session
- User menghapus reading session

## 📊 Features

### 1. Personal Stats

- Total hasanat earned
- Total huruf dibaca
- Streak hari berturut-turut
- Rata-rata hasanat per hari

### 2. Family Leaderboard

- Ranking berdasarkan total hasanat
- Perbandingan dengan anggota keluarga
- Motivasi untuk membaca lebih banyak

### 3. Daily Aggregation

- Otomatis agregasi harian
- Real-time updates
- Historical data tracking

## 🔧 API Endpoints

### Hasanat Stats

```typescript
GET /api/hasanat/stats
Response: {
  total_hasanat: number,
  total_letters: number,
  total_sessions: number,
  daily_average: number,
  streak_days: number,
  longest_streak: number
}
```

### Daily Hasanat

```typescript
GET /api/hasanat/daily?start=2024-01-01&end=2024-01-31
Response: DailyHasanat[]
```

### Family Leaderboard

```typescript
GET /api/hasanat/leaderboard?familyId=uuid
Response: {
  personal: HasanatStats,
  family: LeaderboardEntry[]
}
```

## 🧪 Testing

### 1. Test Hasanat Calculation

```bash
npx ts-node scripts/test-hasanat-calculation.ts
```

### 2. Test Real-time Updates

```bash
npx ts-node scripts/test-realtime-hasanat.ts
```

### 3. Test Family Leaderboard

```bash
npx ts-node scripts/test-leaderboard.ts
```

## 📈 Performance Considerations

### 1. Indexing

- `letter_counts(surah, ayat)` - Primary key
- `daily_hasanat(user_id, date DESC)` - For user queries
- `reading_sessions(user_id, session_time)` - For date filtering

### 2. Caching

- Hasanat stats cached for 5 minutes
- Leaderboard cached for 10 minutes
- Real-time invalidation on data changes

### 3. Batch Processing

- Letter counts seeded in chunks of 1000
- Daily aggregation runs in background
- Optimistic updates for better UX

## 🐛 Troubleshooting

### 1. Hasanat Not Calculating

- Check if `letter_counts` table is seeded
- Verify triggers are active
- Check `reading_sessions` has `ayat_start`/`ayat_end` columns

### 2. Real-time Updates Not Working

- Verify Supabase real-time is enabled
- Check query invalidation keys match
- Ensure user has proper RLS permissions

### 3. Performance Issues

- Check database indexes
- Monitor query execution time
- Consider pagination for large datasets

## 🔮 Future Enhancements

### 1. Advanced Analytics

- Weekly/monthly hasanat trends
- Reading pattern analysis
- Goal setting and tracking

### 2. Gamification

- Achievement badges
- Hasanat milestones
- Family challenges

### 3. Social Features

- Share hasanat progress
- Community leaderboards
- Reading groups

## 📝 Notes

- Hasanat calculation is **server-side** for accuracy
- All data is **timezone-aware** (Asia/Jakarta default)
- System supports **backfill** for existing data
- **Real-time updates** ensure immediate UI refresh
- **RLS policies** ensure data security

---

**Created**: January 25, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
