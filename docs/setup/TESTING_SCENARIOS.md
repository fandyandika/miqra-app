# 🧪 MIQRA TESTING SCENARIOS

## 📋 **OVERVIEW**

Dokumen ini berisi skenario testing lengkap untuk 2 profile yang telah dibuat di Supabase. Setiap skenario dirancang untuk menguji fitur-fitur spesifik dalam aplikasi Miqra.

---

## 👥 **TEST PROFILES**

### **Profile 1: Ahmad Rahman (Owner)**

- **User ID:** `11111111-1111-1111-1111-111111111111`
- **Role:** Family Owner
- **Reading Pattern:** Varied (10-35 ayat/hari)
- **Progress:** 1x Khatam + 350 ayat (Surah 15:25)
- **Streak:** 12 hari current, 45 hari longest
- **Settings:** Public, joins leaderboard, 10 ayat goal

### **Profile 2: Sarah Putri (Member)**

- **User ID:** `22222222-2222-2222-2222-222222222222`
- **Role:** Family Member
- **Reading Pattern:** Konsisten (5-8 ayat/hari)
- **Progress:** 1850 ayat (Surah 8:12)
- **Streak:** 25 hari current, 25 hari longest
- **Settings:** Private, 5 ayat goal, dark theme

---

## 🎯 **TESTING SCENARIOS**

### **1. AUTHENTICATION & PROFILE MANAGEMENT**

#### **Scenario 1.1: Login & Profile Setup**

```sql
-- Test dengan user ID yang sudah ada
-- Ahmad: 11111111-1111-1111-1111-111111111111
-- Sarah: 22222222-2222-2222-2222-222222222222
```

**Expected Results:**

- ✅ Login berhasil dengan user ID yang valid
- ✅ Profile data ter-load dengan benar
- ✅ Display name, avatar, timezone sesuai
- ✅ User settings ter-load dengan benar

#### **Scenario 1.2: Profile Settings Update**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka Settings screen
3. Ubah daily goal dari 10 ke 15 ayat
4. Ubah theme dari light ke dark
5. Toggle hasanat_visible dari true ke false

**Expected Results:**

- ✅ Settings tersimpan ke database
- ✅ UI update sesuai perubahan
- ✅ Data persist setelah reload

---

### **2. READING TRACKING & PROGRESS**

#### **Scenario 2.1: Log Reading Session**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka LogReading screen
3. Pilih surah 15 (Al-Hijr)
4. Set ayat range: 26-35
5. Tambah notes: "Bacaan pagi yang menyegarkan"
6. Submit

**Expected Results:**

- ✅ Reading session tersimpan
- ✅ Progress ter-update (current_surah: 15, current_ayat: 36)
- ✅ Total ayat read bertambah 10
- ✅ Checkin harian ter-update
- ✅ Streak calculation berjalan

#### **Scenario 2.2: Khatam Progress Tracking**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka KhatamProgress screen
3. Periksa progress bar
4. Periksa estimasi khatam
5. Periksa milestone grid

**Expected Results:**

- ✅ Progress bar menampilkan 6586/6236 ayat (105.6%)
- ✅ Khatam count: 1x
- ✅ Estimasi khatam ke-2 berdasarkan rata-rata
- ✅ Milestone grid menampilkan pencapaian

#### **Scenario 2.3: Reading History**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka ReadingHistory screen
3. Scroll through history
4. Periksa detail session

**Expected Results:**

- ✅ Menampilkan 25+ reading sessions
- ✅ Data tersortir berdasarkan tanggal terbaru
- ✅ Detail surah, ayat range, notes ter-load
- ✅ Ayat count calculation benar

---

### **3. FAMILY MANAGEMENT**

#### **Scenario 3.1: Family Dashboard (Owner)**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka Family tab
3. Buka FamilyDashboard screen
4. Periksa HouseView visualization
5. Periksa member list

**Expected Results:**

- ✅ HouseView menampilkan 2/2 members read today
- ✅ Family streak: 25 hari
- ✅ Member list: Ahmad (Owner), Sarah (Member)
- ✅ Status read today: ✅ untuk kedua member

#### **Scenario 3.2: Create Invite Code**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka FamilyDashboard
3. Tap "Buat Kode Undangan"
4. Periksa kode yang di-generate

**Expected Results:**

- ✅ Kode 6 digit ter-generate
- ✅ Kode tersimpan di database
- ✅ TTL set ke 24 jam
- ✅ Alert menampilkan kode dan expiry

#### **Scenario 3.3: Join Family (Member)**

**Test Steps:**

1. Login sebagai Sarah
2. Buka Family tab
3. Periksa family membership
4. Test dengan invite code: 123456

**Expected Results:**

- ✅ Sarah sudah terdaftar sebagai member
- ✅ Family info ter-load dengan benar
- ✅ Invite code 123456 valid (belum expired)
- ✅ Invite code 999999 expired
- ✅ Invite code 888888 sudah used

---

### **4. ANALYTICS & STATISTICS**

#### **Scenario 4.1: Daily Stats**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka Stats screen
3. Pilih periode 30 hari
4. Periksa summary cards

**Expected Results:**

- ✅ Total Ayat: ~450 ayat (25 hari x 18 rata-rata)
- ✅ Rata-rata/Hari: ~18 ayat
- ✅ Hari Aktif: 24 hari (missed 1 hari)

#### **Scenario 4.2: Weekly Trends**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka Stats screen
3. Periksa bar chart mingguan
4. Periksa line chart bulanan

**Expected Results:**

- ✅ Bar chart menampilkan 4 minggu data
- ✅ Line chart menampilkan trend 6 bulan
- ✅ Data konsisten dengan reading sessions

#### **Scenario 4.3: Family Comparison**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka Stats screen
3. Periksa family comparison section

**Expected Results:**

- ✅ Menampilkan "Bacaan Anda" vs "Rata-rata Keluarga"
- ✅ Total Keluarga: ~450 + ~70 = ~520 ayat
- ✅ Encouragement message sesuai performa

---

### **5. STREAK & CONSISTENCY**

#### **Scenario 5.1: Streak Calculation**

**Test Steps:**

1. Login sebagai Ahmad
2. Periksa streak di Home screen
3. Login sebagai Sarah
4. Periksa streak di Home screen

**Expected Results:**

- ✅ Ahmad: Current streak 12, Longest 45
- ✅ Sarah: Current streak 25, Longest 25
- ✅ Streak calculation berdasarkan checkins

#### **Scenario 5.2: Streak Warning**

**Test Steps:**

1. Login sebagai Sarah
2. Simulasi miss reading hari ini
3. Periksa streak warning

**Expected Results:**

- ✅ Streak warning muncul jika enabled
- ✅ Notification reminder berfungsi
- ✅ Streak reset ke 0 jika miss

---

### **6. REAL-TIME SYNC**

#### **Scenario 6.1: Cross-User Sync**

**Test Steps:**

1. Login sebagai Ahmad di device 1
2. Login sebagai Sarah di device 2
3. Ahmad log reading session
4. Periksa Sarah's family dashboard

**Expected Results:**

- ✅ Family dashboard Sarah ter-update real-time
- ✅ HouseView menampilkan perubahan
- ✅ Member activity ter-refresh

#### **Scenario 6.2: Offline Sync**

**Test Steps:**

1. Login sebagai Ahmad
2. Log reading session offline
3. Kembali online
4. Periksa data sync

**Expected Results:**

- ✅ Data tersimpan lokal saat offline
- ✅ Auto-sync saat online
- ✅ Conflict resolution berfungsi

---

### **7. NOTIFICATIONS**

#### **Scenario 7.1: Daily Reminder**

**Test Steps:**

1. Login sebagai Ahmad
2. Periksa reminder settings
3. Simulasi reminder time

**Expected Results:**

- ✅ Reminder time: 06:00:00
- ✅ Daily reminder enabled
- ✅ Notification ter-trigger sesuai waktu

#### **Scenario 7.2: Family Nudge**

**Test Steps:**

1. Login sebagai Sarah
2. Miss reading hari ini
3. Periksa family nudge

**Expected Results:**

- ✅ Family nudge ter-trigger
- ✅ Notification ke Ahmad sebagai owner
- ✅ Encouragement message sesuai

---

### **8. EDGE CASES & ERROR HANDLING**

#### **Scenario 8.1: Invalid Reading Range**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka LogReading
3. Set ayat end < ayat start
4. Submit

**Expected Results:**

- ✅ Error message: "Ayat akhir tidak boleh lebih kecil dari awal"
- ✅ Form tidak submit
- ✅ User bisa koreksi input

#### **Scenario 8.2: Surah Ayat Limit**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka LogReading
3. Pilih surah 1 (Al-Fatihah)
4. Set ayat range: 1-10

**Expected Results:**

- ✅ Error message: "Surah ini hanya 7 ayat"
- ✅ Form tidak submit
- ✅ Ayat range ter-reset ke valid

#### **Scenario 8.3: Network Error**

**Test Steps:**

1. Login sebagai Ahmad
2. Disconnect internet
3. Log reading session
4. Reconnect internet

**Expected Results:**

- ✅ Data tersimpan lokal
- ✅ Error handling graceful
- ✅ Auto-retry saat online
- ✅ Success message setelah sync

---

### **9. PERFORMANCE TESTING**

#### **Scenario 9.1: Large Data Load**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka ReadingHistory
3. Scroll through 25+ sessions
4. Periksa loading performance

**Expected Results:**

- ✅ Loading time < 2 detik
- ✅ Smooth scrolling
- ✅ Memory usage stabil

#### **Scenario 9.2: Real-time Updates**

**Test Steps:**

1. Login sebagai Ahmad
2. Buka multiple screens
3. Log reading session
4. Periksa update performance

**Expected Results:**

- ✅ All screens ter-update < 1 detik
- ✅ No memory leaks
- ✅ Smooth animations

---

### **10. DATA INTEGRITY**

#### **Scenario 10.1: Data Consistency**

**Test Steps:**

1. Login sebagai Ahmad
2. Log reading session
3. Periksa data di semua tabel

**Expected Results:**

- ✅ reading_sessions: 1 record baru
- ✅ reading_progress: ter-update
- ✅ checkins: ayat_count ter-update
- ✅ streaks: ter-recalculate

#### **Scenario 10.2: Family Data Integrity**

**Test Steps:**

1. Login sebagai Ahmad
2. Create invite code
3. Login sebagai Sarah
4. Redeem invite code

**Expected Results:**

- ✅ Invite code marked as used
- ✅ Sarah added to family
- ✅ Family member count ter-update
- ✅ RLS policies enforced

---

## 🔧 **TESTING TOOLS & COMMANDS**

### **Database Verification**

```sql
-- Check profile data
SELECT * FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Check reading progress
SELECT * FROM reading_progress WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Check family data
SELECT f.*, fm.* FROM families f
JOIN family_members fm ON f.id = fm.family_id
WHERE f.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Check recent checkins
SELECT * FROM checkins
WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ORDER BY date DESC LIMIT 10;
```

### **API Testing**

```bash
# Test reading progress API
curl -X GET "https://your-project.supabase.co/rest/v1/reading_progress?user_id=eq.11111111-1111-1111-1111-111111111111" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test family stats API
curl -X GET "https://your-project.supabase.co/rest/v1/rpc/get_family_stats?p_family_id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **SUCCESS CRITERIA**

### **Functional Requirements**

- ✅ All CRUD operations work correctly
- ✅ Real-time sync functions properly
- ✅ Data integrity maintained
- ✅ Error handling graceful
- ✅ Performance meets requirements

### **User Experience**

- ✅ Intuitive navigation
- ✅ Responsive UI
- ✅ Clear feedback messages
- ✅ Offline functionality
- ✅ Accessibility features

### **Data Accuracy**

- ✅ Calculations correct
- ✅ Progress tracking accurate
- ✅ Streak calculation valid
- ✅ Family aggregation correct
- ✅ Analytics data reliable

---

## 🚀 **NEXT STEPS**

1. **Run SQL Script**: Execute `test_profiles_setup.sql` di Supabase
2. **Verify Data**: Run verification queries
3. **Test Scenarios**: Execute each scenario systematically
4. **Document Issues**: Log any bugs or issues found
5. **Performance Check**: Monitor app performance during testing
6. **User Acceptance**: Validate with real users if possible

---

**Happy Testing! 🎉**
