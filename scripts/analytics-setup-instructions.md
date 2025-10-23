# Analytics Setup Instructions

## 🚀 **STEP 1: Run Migration in Supabase Dashboard**

1. **Buka Supabase Dashboard** → SQL Editor
2. **Copy SQL lengkap** dari file `supabase/migrations/20251022_analytics_functions.sql`
3. **Paste dan Run** di SQL Editor

### Expected Output:

- ✅ 6 functions created: `get_daily_stats`, `get_weekly_stats`, `get_monthly_stats`, `get_user_total_stats`, `get_family_stats`, `_rs_day`, `_rs_date`
- ✅ 2 indexes created: `idx_reading_sessions_user_date`, `idx_family_members_family_user`

## 🧪 **STEP 2: Test PostgreSQL Functions**

Jalankan test script:

```bash
node scripts/test-analytics-manual.js
```

### Expected Output:

```
✅ Daily stats: X days
✅ Weekly stats: X weeks
✅ Monthly stats: X months
✅ User total stats: {...}
✅ Family stats: {...} (if in family)
```

## 🔧 **STEP 3: Test TypeScript Service Layer**

Jalankan service test:

```bash
node scripts/test-analytics-service.js
```

### Expected Output:

```
✅ Daily stats test passed: X days
✅ Weekly stats test passed: X weeks
✅ Monthly stats test passed: X months
✅ Reading pattern test passed: X active hours
✅ User total stats test passed: {...}
✅ Comparative stats test passed: {...}
```

## 📊 **STEP 4: Manual SQL Testing (Optional)**

Test individual functions in Supabase SQL Editor:

```sql
-- Test daily stats
SELECT * FROM get_daily_stats(
  '<your-user-id>',
  '2025-01-01',
  '2025-12-31'
);

-- Test weekly stats
SELECT * FROM get_weekly_stats(
  '<your-user-id>',
  '2025-09-01',
  '2025-12-31'
);

-- Test monthly stats
SELECT * FROM get_monthly_stats('<your-user-id>', 6);

-- Test user totals
SELECT * FROM get_user_total_stats('<your-user-id>');

-- Test family stats (if in family)
SELECT * FROM get_family_stats('<family-id>');
```

## 🎯 **STEP 5: Integration Test in App**

Add to any screen for testing:

```typescript
import * as analytics from '@/services/analytics';

// Test in useEffect or button press
const testAnalytics = async () => {
  try {
    const daily = await analytics.getDailyStats(
      subDays(new Date(), 30),
      new Date()
    );
    console.log('Daily:', daily);

    const weekly = await analytics.getWeeklyStats(4);
    console.log('Weekly:', weekly);

    const monthly = await analytics.getMonthlyStats(6);
    console.log('Monthly:', monthly);

    const pattern = await analytics.getReadingPattern();
    console.log('Pattern:', pattern);

    const heatmap = await analytics.getYearHeatmap();
    console.log('Heatmap:', heatmap.length, 'days');

    const comparative = await analytics.getComparativeStats();
    console.log('Comparative:', comparative);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
```

## ✅ **VERIFICATION CHECKLIST**

- [ ] Migration executed successfully
- [ ] All 6 functions appear in Database > Functions
- [ ] Manual test script passes
- [ ] Service layer test passes
- [ ] Console shows proper logging (📊 fetching, ✅ success)
- [ ] No error messages in console
- [ ] Data accuracy verified against raw reading_sessions

## 🚨 **TROUBLESHOOTING**

### If functions don't exist:

- Check SQL was executed completely
- Verify no syntax errors in migration
- Check Database > Functions in Supabase

### If RPC calls fail:

- Check user authentication
- Verify user has reading_sessions data
- Check RLS policies are correct

### If service layer fails:

- Check TypeScript compilation
- Verify date-fns is installed
- Check console for specific error messages

## 📈 **PERFORMANCE NOTES**

- All heavy aggregation happens in PostgreSQL
- Client only processes small result sets
- Indexes optimize date-range queries
- Streak calculation is server-side
- Heatmap uses quartile-based intensity levels
