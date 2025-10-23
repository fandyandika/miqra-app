# 🎯 Panduan Testing HouseView di Supabase

## Cara Testing HouseView Langsung di Supabase

### 1. **Buat Keluarga di Supabase**

- Buka **Supabase Dashboard** → **Table Editor** → **families**
- Klik **Insert** → **Insert row**
- Isi: `name` = "Keluarga Test"
- Klik **Save**

### 2. **Buat User dan Profile**

- Buka **Authentication** → **Users** → **Add user**
- Email: `test@example.com`
- Password: `password123`
- **Copy User ID** yang muncul

- Buka **Table Editor** → **profiles**
- Insert row:
  - `user_id` = User ID yang dicopy
  - `display_name` = "Test User"

### 3. **Tambah User ke Keluarga**

- Buka **Table Editor** → **family_members**
- Insert row:
  - `family_id` = ID keluarga dari step 1
  - `user_id` = User ID dari step 2
  - `role` = "owner"

### 4. **Buat Checkin untuk Testing**

- Buka **Table Editor** → **checkins**
- Insert beberapa row dengan data:

**Checkin Hari Ini:**

- `user_id` = User ID
- `date` = `2025-10-18` (hari ini)
- `ayat_count` = `5`
- `created_at` = `2025-10-18T10:00:00Z`

**Checkin Kemarin:**

- `user_id` = User ID
- `date` = `2025-10-17` (kemarin)
- `ayat_count` = `3`
- `created_at` = `2025-10-17T10:00:00Z`

**Checkin 2 Hari Lalu:**

- `user_id` = User ID
- `date` = `2025-10-16` (2 hari lalu)
- `ayat_count` = `4`
- `created_at` = `2025-10-16T10:00:00Z`

### 5. **Test di App**

1. **Jalankan app**: `npx expo start --port 8084`
2. **Login** dengan `test@example.com` / `password123`
3. **Masuk ke Family tab**
4. **Klik keluarga** untuk masuk Family Dashboard
5. **Lihat HouseView** - seharusnya muncul dengan data real

## Skenario Testing yang Bisa Dicoba

### **Skenario 1: Keluarga Baru (0% progress)**

- Buat keluarga dengan 1 member
- Tidak ada checkin hari ini
- **Expected**: 🏠 Dark house

### **Skenario 2: Keluarga Setengah Progress (50% progress)**

- Buat keluarga dengan 2 members
- 1 member checkin hari ini
- **Expected**: 🏡 Dim house

### **Skenario 3: Keluarga Full Progress (100% progress)**

- Buat keluarga dengan 2 members
- 2 members checkin hari ini
- **Expected**: 🌇 Bright house

### **Skenario 4: Keluarga Radiant (100% + streak)**

- Buat keluarga dengan 2 members
- 2 members checkin hari ini
- Buat checkin untuk 5+ hari berturut-turut
- **Expected**: 🏠✨ Radiant house

## Query SQL untuk Cek Data

### **Lihat Progress Keluarga Hari Ini:**

```sql
SELECT
  f.name as family_name,
  COUNT(DISTINCT fm.user_id) as total_members,
  COUNT(DISTINCT CASE WHEN c.date = CURRENT_DATE THEN c.user_id END) as members_read_today,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.date = CURRENT_DATE THEN c.user_id END) * 100.0 /
    COUNT(DISTINCT fm.user_id), 2
  ) as progress_percentage
FROM families f
JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN checkins c ON fm.user_id = c.user_id AND c.date = CURRENT_DATE
GROUP BY f.id, f.name
ORDER BY progress_percentage DESC;
```

### **Lihat Checkin Terbaru:**

```sql
SELECT
  p.display_name,
  f.name as family_name,
  c.date,
  c.ayat_count
FROM checkins c
JOIN profiles p ON c.user_id = p.user_id
LEFT JOIN family_members fm ON c.user_id = fm.user_id
LEFT JOIN families f ON fm.family_id = f.id
ORDER BY c.created_at DESC
LIMIT 10;
```

## Tips Testing

1. **Gunakan tanggal yang sama** dengan hari ini untuk testing
2. **Buat beberapa checkin** dengan tanggal berbeda untuk test streak
3. **Gunakan data real** - lebih mudah untuk debug
4. **Cek console logs** di Metro bundler untuk melihat error
5. **Refresh app** setelah mengubah data di Supabase

## Troubleshooting

- **HouseView tidak muncul**: Cek console untuk error
- **Data tidak update**: Coba refresh app
- **Error database**: Cek relasi tabel di Supabase
- **Login gagal**: Cek user di Authentication tab
