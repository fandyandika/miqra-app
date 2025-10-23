# Chart Components Guide

## 🎨 **VICTORY-NATIVE CHART COMPONENTS**

Sistem data visualization yang komprehensif untuk Miqra menggunakan Victory-Native library.

### 📦 **Dependencies Installed:**

- `victory-native` - Mobile-optimized charting library
- `react-native-svg` - SVG support for charts

### 🧩 **Components Available:**

#### 1. **BarChart** - Bar chart dengan animasi

```typescript
import { BarChart } from '@/components/charts';

<BarChart
  data={[
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 20 },
    { label: 'Wed', value: 15 },
  ]}
  title="Minggu Ini"
  color="#00C896"
  height={220}
/>
```

**Features:**

- ✅ Responsive bar width berdasarkan jumlah data
- ✅ Smooth animations (500ms duration)
- ✅ Empty state dengan icon dan pesan
- ✅ Angled labels untuk dataset besar (>8 items)
- ✅ Custom colors dan height

#### 2. **LineChart** - Line chart dengan smooth curves

```typescript
import { LineChart } from '@/components/charts';

<LineChart
  data={[
    { label: 'Jan', value: 50 },
    { label: 'Feb', value: 80 },
    { label: 'Mar', value: 60 },
  ]}
  title="30 Hari Terakhir"
  color="#FF8A65"
  height={220}
/>
```

**Features:**

- ✅ Smooth curves dengan `monotoneX` interpolation
- ✅ Scatter points pada setiap data point
- ✅ Responsive design untuk mobile
- ✅ Empty state handling
- ✅ Custom stroke width dan colors

#### 3. **Heatmap** - GitHub-style activity heatmap

```typescript
import { Heatmap } from '@/components/charts';

<Heatmap
  data={heatmapData} // 365 days of data
  title="Aktivitas Tahun Ini"
/>
```

**Features:**

- ✅ 52 weeks layout dengan horizontal scroll
- ✅ Month labels otomatis
- ✅ Day labels (M, R, K, J, S)
- ✅ 5 intensity levels (0-4) dengan quartile calculation
- ✅ Legend dengan "Sedikit" → "Banyak"
- ✅ Responsive cell size (12px)

#### 4. **StatCard** - Metric display cards

```typescript
import { StatCard } from '@/components/charts';

<StatCard
  value={282}
  label="Total Ayat"
  icon="📖"
  color="#00C896"
/>
```

**Features:**

- ✅ Number formatting dengan locale Indonesia
- ✅ Icon support (emoji)
- ✅ Custom colors
- ✅ Responsive layout
- ✅ Consistent styling

### 🎨 **Brand Colors:**

- **Primary Green**: `#00C896`
- **Coral**: `#FF8A65`
- **Gold**: `#FFB627`
- **Gray Scale**: `#6B7280`, `#9CA3AF`, `#E5E7EB`

### 📱 **Mobile Optimizations:**

- ✅ Screen width responsive (`Dimensions.get('window').width`)
- ✅ Chart width calculation dengan padding
- ✅ Touch-friendly interactions
- ✅ Smooth animations (300-500ms)
- ✅ Empty states untuk semua components

### 🔧 **Usage Examples:**

#### **Analytics Screen Integration:**

```typescript
import { BarChart, LineChart, Heatmap, StatCard } from '@/components/charts';
import { getDailyStats, getYearHeatmap, getUserTotalStats } from '@/services/analytics';

const AnalyticsScreen = () => {
  const { data: dailyStats } = useQuery({
    queryKey: analyticsKeys.daily(startDate, endDate),
    queryFn: () => getDailyStats(startDate, endDate),
  });

  return (
    <ScrollView>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard value={282} label="Total Ayat" icon="📖" />
        <StatCard value={4} label="Current Streak" icon="🔥" />
      </View>

      {/* Charts */}
      <BarChart data={barData} title="Minggu Ini" />
      <LineChart data={lineData} title="30 Hari Terakhir" />
      <Heatmap data={heatmapData} title="Aktivitas Tahun Ini" />
    </ScrollView>
  );
};
```

#### **Empty State Handling:**

```typescript
// Semua components handle empty data gracefully
<BarChart data={[]} title="No Data" />
// Shows: 📊 "Belum ada data"

<LineChart data={[]} title="No Data" />
// Shows: 📈 "Belum ada data"

<Heatmap data={[]} title="No Data" />
// Shows: 🗓️ "Belum ada data heatmap"
```

#### **Data Transformation:**

```typescript
// Transform analytics data untuk charts
const barChartData =
  dailyStats
    ?.filter(stat => stat.ayat_count > 0)
    .slice(-7)
    .map(stat => ({
      label: format(new Date(stat.date), 'EEE'),
      value: stat.ayat_count,
    })) ?? [];

const lineChartData =
  monthlyStats
    ?.filter(stat => stat.ayat_count > 0)
    .slice(-14)
    .map(stat => ({
      label: format(new Date(stat.date), 'MMM dd'),
      value: stat.ayat_count,
    })) ?? [];
```

### 🧪 **Testing:**

```bash
# Test chart components
node scripts/test-chart-components.js

# Expected output:
✅ BarChart: Empty, small, large datasets
✅ LineChart: Monthly progression data
✅ Heatmap: Year-long activity data
✅ StatCard: Various metric displays
✅ Real data integration working
```

### 📊 **Performance:**

- ✅ **Victory-Native optimized** untuk mobile
- ✅ **Server-side data processing** dengan analytics functions
- ✅ **React Query caching** untuk data fetching
- ✅ **Smooth animations** tanpa lag
- ✅ **Memory efficient** dengan proper cleanup

### 🎯 **Best Practices:**

1. **Always handle empty data** - Components show friendly empty states
2. **Use appropriate chart types** - Bar untuk comparison, Line untuk trends
3. **Limit data points** - Max 30 items untuk BarChart, 14 untuk LineChart
4. **Consistent colors** - Gunakan brand colors yang sudah didefinisikan
5. **Responsive design** - Components otomatis adjust ke screen size

**Chart components sekarang siap digunakan di aplikasi Miqra!** 🚀📊
