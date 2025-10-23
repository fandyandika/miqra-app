import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import {
  getWeeklyStats,
  getMonthlyStats,
  getReadingPattern,
  getYearHeatmap,
  analyticsKeys,
} from '@/services/analytics';
import { getComparativeStatsWithFamiliesDirect } from '@/services/familyAnalyticsDirect';
import { debugFamilyData } from '@/services/debugFamily';
import { getSettings } from '@/services/profile';
import { getCurrentStreak } from '@/services/checkins';
import { CompactStatsCard } from '@/components/charts/CompactStatsCard';
import { DailyGoalProgress } from '@/components/charts/DailyGoalProgress';
import { FamilyComparisonCard } from '@/components/charts/FamilyComparisonCard';
import { Heatmap } from '@/components/charts/Heatmap';
import { BarChart } from '@/components/charts/SimpleBarChart';
import { colors } from '@/theme/colors';

type TimePeriod = '7D' | '30D' | '90D' | '365D';

const PERIOD_CONFIG = {
  '7D': { weeks: 1, label: '7 Hari', days: 7 },
  '30D': { weeks: 4, label: '30 Hari', days: 30 },
  '90D': { weeks: 12, label: '90 Hari', days: 90 },
  '365D': { weeks: 52, label: '1 Tahun', days: 365 },
};

export default function StatsScreen() {
  const [period, setPeriod] = useState<TimePeriod>('30D');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // =========================================
  // QUERIES
  // =========================================

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: analyticsKeys.weekly(PERIOD_CONFIG[period].weeks),
    queryFn: () => getWeeklyStats(PERIOD_CONFIG[period].weeks),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: analyticsKeys.monthly(6),
    queryFn: () => getMonthlyStats(6),
    staleTime: 5 * 60 * 1000,
  });

  const { data: patternData, isLoading: patternLoading } = useQuery({
    queryKey: analyticsKeys.pattern(),
    queryFn: getReadingPattern,
    staleTime: 5 * 60 * 1000,
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn: getYearHeatmap,
    staleTime: 10 * 60 * 1000, // 10 minutes (expensive query)
  });

  const { data: comparativeData, isLoading: comparativeLoading } = useQuery({
    queryKey: ['comparativeStats', selectedFamilyId],
    queryFn: async () => {
      // Debug family data
      console.log('🔍 Debugging family data...');
      await debugFamilyData();
      
      return getComparativeStatsWithFamiliesDirect(selectedFamilyId || undefined);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 30_000, // 30 seconds
  });

  const isLoading =
    weeklyLoading || monthlyLoading || patternLoading || heatmapLoading || settingsLoading || streakLoading;

  // =========================================
  // CALCULATIONS
  // =========================================

  // Summary stats from weekly data with safe fallbacks
  const totalAyat =
    weeklyData?.reduce((sum, w) => sum + (w?.total_ayat || 0), 0) || 0;
  const daysActive =
    weeklyData?.reduce((sum, w) => sum + (w?.days_active || 0), 0) || 0;
  const avgPerDay = daysActive > 0 ? Math.round(totalAyat / daysActive) : 0;

  // Transform data for charts with safe fallbacks
  const weeklyChartData =
    weeklyData?.map(w => ({
      label: format(new Date(w?.week_start || new Date()), 'dd MMM', {
        locale: localeID,
      }),
      value: w?.total_ayat || 0,
    })) || [];

  const monthlyChartData =
    monthlyData
      ?.map(m => ({
        label: format(new Date((m?.month || '2024-01') + '-01'), 'MMM', {
          locale: localeID,
        }),
        value: m?.total_ayat || 0,
      }))
      .reverse() || []; // Reverse to show oldest first

  const patternChartData =
    patternData
      ?.filter(p => (p?.count || 0) > 0)
      .map(p => ({
        label: `${(p?.hour || 0).toString().padStart(2, '0')}:00`,
        value: Math.round(p?.avg_ayat || 0),
      })) || [];

  // Find peak reading hour with safe fallbacks
  const peakHour = patternData?.reduce(
    (max, p) => ((p?.count || 0) > (max?.count || 0) ? p : max),
    { hour: 0, count: 0, avg_ayat: 0 }
  ) || { hour: 0, count: 0, avg_ayat: 0 };

  // =========================================
  // LOADING STATE
  // =========================================

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.loadingText}>Memuat statistik...</Text>
      </View>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Statistik Bacaan</Text>
        <Text style={styles.headerSubtitle}>
          Analisis progres bacaan Al-Qur'an Anda
        </Text>
      </View>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {(Object.keys(PERIOD_CONFIG) as TimePeriod[]).map(p => (
          <Pressable
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive,
              ]}
            >
              {PERIOD_CONFIG[p].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <CompactStatsCard
          value={totalAyat.toLocaleString('id-ID')}
          label="Total Ayat"
          icon="📖"
          color={colors.primary}
        />
        <CompactStatsCard
          value={avgPerDay}
          label="Rata-rata/Hari"
          icon="📈"
          color={colors.accent}
        />
        <CompactStatsCard
          value={daysActive}
          label="Hari Aktif"
          icon="🔥"
          color={colors.secondary}
        />
      </View>

      {/* Daily Goal Progress */}
      <DailyGoalProgress
        currentAyat={totalAyat}
        dailyGoal={userSettings?.daily_goal_ayat || 5}
        daysInPeriod={PERIOD_CONFIG[period].days}
        periodLabel={PERIOD_CONFIG[period].label}
      />

      {/* Weekly Trend Chart */}
      {weeklyChartData.length > 0 && (
        <BarChart
          data={weeklyChartData}
          title={`📊 Trend ${PERIOD_CONFIG[period].label}`}
          color={colors.primary}
          height={200}
        />
      )}

      {/* Reading Pattern - Simplified */}
      {peakHour && peakHour.count > 0 && (
        <View style={styles.patternCard}>
          <Text style={styles.patternTitle}>⏰ Jam Favorit Membaca</Text>
          <Text style={styles.patternValue}>
            {(peakHour?.hour || 0).toString().padStart(2, '0')}:00
          </Text>
          <Text style={styles.patternSubtitle}>
            {peakHour?.count || 0} sesi, rata-rata {Math.round(peakHour?.avg_ayat || 0)} ayat
          </Text>
        </View>
      )}

      {/* Year Heatmap */}
      {heatmapData && heatmapData.length > 0 && (
        <Heatmap
          data={heatmapData}
          title='🔥 Konsistensi Bacaan (365 Hari Terakhir)'
        />
      )}

      {/* Family Comparison */}
      {console.log('🔍 StatsScreen - Family Data:', {
        families: comparativeData?.families?.length || 0,
        selectedFamilyId: comparativeData?.selectedFamilyId,
        personalAyat: comparativeData?.personal?.total_ayat || 0,
        familyStats: comparativeData?.family,
        period,
      })}
      <FamilyComparisonCard
        personalAyat={comparativeData?.personal?.total_ayat || 0}
        familyStats={comparativeData?.family || null}
        families={comparativeData?.families || []}
        selectedFamilyId={comparativeData?.selectedFamilyId || null}
        onFamilyChange={setSelectedFamilyId}
        period={period}
        onPeriodChange={setPeriod}
        isLoading={comparativeLoading}
      />

      {/* Insights Section */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>💡 Insight</Text>

        {/* Performance insight */}
        <View style={styles.insightCard}>
          {avgPerDay >= 10 ? (
            <>
              <Text style={styles.insightIcon}>🌙</Text>
              <Text style={styles.insightText}>
                Alhamdulillah! Rata-rata Anda{' '}
                <Text style={styles.insightBold}>{avgPerDay} ayat/hari</Text>.
                Istiqomah yang luar biasa!
              </Text>
            </>
          ) : avgPerDay >= 5 ? (
            <>
              <Text style={styles.insightIcon}>📖</Text>
              <Text style={styles.insightText}>
                Alhamdulillah! Anda konsisten dengan{' '}
                <Text style={styles.insightBold}>{avgPerDay} ayat/hari</Text>.
                Terus pertahankan!
              </Text>
            </>
          ) : avgPerDay >= 1 ? (
            <>
              <Text style={styles.insightIcon}>🌱</Text>
              <Text style={styles.insightText}>
                Barakallah! Anda sudah memulai kebiasaan baik. Coba tingkatkan
                sedikit demi sedikit.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.insightIcon}>🌟</Text>
              <Text style={styles.insightText}>
                Mari mulai kebiasaan baik dengan target 1 ayat per hari.
              </Text>
            </>
          )}
        </View>

        {/* Peak time insight */}
        {peakHour && peakHour.count > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>⏰</Text>
            <Text style={styles.insightText}>
              Waktu favorit Anda membaca:{' '}
              <Text style={styles.insightBold}>
                {(peakHour?.hour || 0).toString().padStart(2, '0')}:00
              </Text>{' '}
              ({peakHour?.count || 0} sesi)
            </Text>
          </View>
        )}

        {/* Consistency insight */}
        {streakData && (
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🔥</Text>
            <Text style={styles.insightText}>
              Streak saat ini:{' '}
              <Text style={styles.insightBold}>
                {streakData?.current || 0} hari
                berturut-turut
              </Text>
              {streakData?.longest > 0 && (
                <Text style={styles.insightText}>
                  {'\n'}Terpanjang: {streakData?.longest} hari
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* Activity insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>📊</Text>
          <Text style={styles.insightText}>
            Anda aktif <Text style={styles.insightBold}>{daysActive} hari</Text>{' '}
            dalam {PERIOD_CONFIG[period].label.toLowerCase()} terakhir
          </Text>
        </View>
      </View>

      {/* Motivational Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerQuote}>
          "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan
          mengajarkannya"
        </Text>
        <Text style={styles.footerSource}>— HR. Bukhari</Text>
      </View>

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  // Header
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#00C896', // Exact brand green
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  // Summary Cards
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  // Pattern Card
  patternCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  patternValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  patternSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Insights Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#FFF8F0', // Soft Sand
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB627', // Softer gold accent
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#B45309', // Softer gold text color
    lineHeight: 20,
  },
  insightBold: {
    fontWeight: '700',
    color: '#92400E', // Slightly darker gold for emphasis
  },
  // Footer
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  footerSource: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
});
