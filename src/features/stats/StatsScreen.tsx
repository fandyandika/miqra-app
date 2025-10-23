import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
import { supabase } from '@/lib/supabase';
import { CompactStatsCard } from '@/components/charts/CompactStatsCard';
import { DailyGoalProgress } from '@/components/charts/DailyGoalProgress';
import { FamilyComparisonCard } from '@/components/charts/FamilyComparisonCard';
import { Heatmap } from '@/components/charts/Heatmap';
import { BarChart } from '@/components/charts/SimpleBarChart';
import { colors } from '@/theme/colors';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

const PERIOD_CONFIG = {
  day: { weeks: 1, label: 'Hari', days: 1 },
  week: { weeks: 1, label: 'Minggu', days: 7 },
  month: { weeks: 4, label: 'Bulan', days: 30 },
  year: { weeks: 52, label: 'Tahun', days: 365 },
};

export default function StatsScreen() {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // =========================================
  // QUERIES
  // =========================================

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly', period, PERIOD_CONFIG[period].days],
    queryFn: () => {
      if (period === 'day') {
        // For day view, get only 1 week to get today's data
        return getWeeklyStats(1);
      } else if (period === 'week') {
        // For week view, get 1 week
        return getWeeklyStats(1);
      } else if (period === 'month') {
        // For month view, get 4 weeks
        return getWeeklyStats(4);
      } else {
        // For year view, get 52 weeks
        return getWeeklyStats(52);
      }
    },
    staleTime: 0, // Always fresh data
  });

  // Get today's data directly for day period
  const { data: todayData } = useQuery({
    queryKey: ['today-stats'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return { total_ayat: 0, days_active: 0 };

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      const { data: checkins } = await supabase
        .from('checkins')
        .select('ayat_count')
        .eq('user_id', userId)
        .eq('date', todayStr);

      const totalAyat = checkins?.reduce((sum, c) => sum + (c.ayat_count || 0), 0) || 0;

      console.log('📊 Today direct data:', { todayStr, checkins, totalAyat });

      return {
        total_ayat: totalAyat,
        days_active: totalAyat > 0 ? 1 : 0,
      };
    },
    enabled: period === 'day',
    staleTime: 0,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly', period, PERIOD_CONFIG[period].days],
    queryFn: () => {
      if (period === 'day' || period === 'week') {
        // For day/week view, get 1 month
        return getMonthlyStats(1);
      } else if (period === 'month') {
        // For month view, get 1 month
        return getMonthlyStats(1);
      } else {
        // For year view, get 12 months
        return getMonthlyStats(12);
      }
    },
    staleTime: 0, // Always fresh data
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
    queryFn: () => getComparativeStatsWithFamiliesDirect(selectedFamilyId || undefined),
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
    staleTime: 0, // Always fresh
  });

  const isLoading =
    weeklyLoading ||
    monthlyLoading ||
    patternLoading ||
    heatmapLoading ||
    settingsLoading ||
    streakLoading;

  // =========================================
  // CALCULATIONS
  // =========================================

  // Summary stats based on selected period
  const getStatsForPeriod = () => {
    console.log('📊 Calculating stats for period:', period);
    console.log('📊 Weekly data:', weeklyData);
    console.log('📊 Monthly data:', monthlyData);

    if (period === 'day') {
      // For day view, use direct today data
      const totalAyat = todayData?.total_ayat || 0;
      const daysActive = todayData?.days_active || 0;

      console.log('📊 Today data for period "day":', {
        todayData,
        totalAyat,
        daysActive,
      });

      return {
        totalAyat: totalAyat,
        daysActive: daysActive,
        avgPerDay: totalAyat, // Same as total for single day
      };
    } else if (period === 'week') {
      // For week view, show current week data
      const totalAyat = weeklyData?.reduce((sum, w) => sum + (w?.total_ayat || 0), 0) || 0;
      const daysActive = weeklyData?.reduce((sum, w) => sum + (w?.days_active || 0), 0) || 0;
      return {
        totalAyat,
        daysActive,
        avgPerDay: daysActive > 0 ? Math.round(totalAyat / daysActive) : 0,
      };
    } else if (period === 'month') {
      // For month view, show monthly data
      const totalAyat = monthlyData?.reduce((sum, m) => sum + (m?.total_ayat || 0), 0) || 0;
      const daysActive = monthlyData?.reduce((sum, m) => sum + (m?.days_active || 0), 0) || 0;
      return {
        totalAyat,
        daysActive,
        avgPerDay: daysActive > 0 ? Math.round(totalAyat / daysActive) : 0,
      };
    } else {
      // For year view, aggregate all weekly data
      const totalAyat = weeklyData?.reduce((sum, w) => sum + (w?.total_ayat || 0), 0) || 0;
      const daysActive = weeklyData?.reduce((sum, w) => sum + (w?.days_active || 0), 0) || 0;
      return {
        totalAyat,
        daysActive,
        avgPerDay: daysActive > 0 ? Math.round(totalAyat / daysActive) : 0,
      };
    }
  };

  const { totalAyat, daysActive, avgPerDay } = getStatsForPeriod();

  // Transform data for charts with safe fallbacks
  const weeklyChartData =
    weeklyData?.map((w) => ({
      label: format(new Date(w?.week_start || new Date()), 'dd MMM', {
        locale: localeID,
      }),
      value: w?.total_ayat || 0,
    })) || [];

  const monthlyChartData =
    monthlyData
      ?.map((m) => ({
        label: format(new Date((m?.month || '2024-01') + '-01'), 'MMM', {
          locale: localeID,
        }),
        value: m?.total_ayat || 0,
      }))
      .reverse() || []; // Reverse to show oldest first

  // Chart data based on selected period
  const getChartData = () => {
    if (period === 'day') {
      // For day view, show today's data with goal comparison
      const todayValue = todayData?.total_ayat || 0;
      const dailyGoal = userSettings?.daily_goal_ayat || 5;
      const isGoalMet = todayValue >= dailyGoal;

      return [
        {
          label: 'Hari Ini',
          value: todayValue,
          goal: dailyGoal,
          isGoalMet: isGoalMet,
          status: isGoalMet ? '✅' : '❌',
        },
      ];
    } else if (period === 'week') {
      // For week view, show 7 days of current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

      const weekData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'EEE', { locale: localeID });

        // For now, use placeholder data - in real implementation,
        // you'd fetch daily data for each day of the week
        weekData.push({
          label: dayName,
          value: Math.floor(Math.random() * 50), // Placeholder - replace with real data
          date: dateStr,
        });
      }
      return weekData;
    } else if (period === 'month') {
      // For month view, show all days of current month
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const monthData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'd');

        // For now, use placeholder data - in real implementation,
        // you'd fetch daily data for each day of the month
        monthData.push({
          label: dayName,
          value: Math.floor(Math.random() * 30), // Placeholder - replace with real data
          date: dateStr,
        });
      }
      return monthData;
    } else {
      // For year view, show monthly data
      return monthlyChartData;
    }
  };

  const chartData = getChartData();

  const patternChartData =
    patternData
      ?.filter((p) => (p?.count || 0) > 0)
      .map((p) => ({
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
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerSubtitle}>Analisis progres bacaan Al-Qur'an Anda</Text>
      </View>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {(Object.keys(PERIOD_CONFIG) as TimePeriod[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
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
        <CompactStatsCard value={avgPerDay} label="Ayat/Hari" icon="📈" color={colors.accent} />
        <CompactStatsCard
          value={streakData?.current || 0}
          label="Streak"
          icon="🔥"
          color={colors.secondary}
        />
      </View>

      {/* Daily Goal Progress */}
      <DailyGoalProgress
        currentAyat={period === 'day' ? totalAyat : totalAyat / Math.max(daysActive, 1)}
        dailyGoal={userSettings?.daily_goal_ayat || 5}
        daysInPeriod={PERIOD_CONFIG[period].days}
        periodLabel={PERIOD_CONFIG[period].label}
      />

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <BarChart
          data={chartData}
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
        <Heatmap data={heatmapData} title="🔥 Konsistensi Bacaan (365 Hari Terakhir)" />
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
                <Text style={styles.insightBold}>{avgPerDay} ayat/hari</Text>. Istiqomah yang luar
                biasa!
              </Text>
            </>
          ) : avgPerDay >= 5 ? (
            <>
              <Text style={styles.insightIcon}>📖</Text>
              <Text style={styles.insightText}>
                Alhamdulillah! Anda konsisten dengan{' '}
                <Text style={styles.insightBold}>{avgPerDay} ayat/hari</Text>. Terus pertahankan!
              </Text>
            </>
          ) : avgPerDay >= 1 ? (
            <>
              <Text style={styles.insightIcon}>🌱</Text>
              <Text style={styles.insightText}>
                Barakallah! Anda sudah memulai kebiasaan baik. Coba tingkatkan sedikit demi sedikit.
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
              <Text style={styles.insightBold}>{streakData?.current || 0} hari berturut-turut</Text>
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
            Anda aktif <Text style={styles.insightBold}>{daysActive} hari</Text> dalam{' '}
            {PERIOD_CONFIG[period].label.toLowerCase()} terakhir
          </Text>
        </View>
      </View>

      {/* Motivational Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerQuote}>
          "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya"
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
