import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart, LineChart, Heatmap, StatCard } from '@/components/charts';
import {
  getDailyStats,
  getYearHeatmap,
  getUserTotalStats,
  analyticsKeys,
} from '@/services/analytics';
import { subDays, format } from 'date-fns';
import { colors } from '@/theme/colors';

export default function AnalyticsScreen() {
  // Get last 7 days data for BarChart
  const { data: dailyStats } = useQuery({
    queryKey: analyticsKeys.daily(subDays(new Date(), 7), new Date()),
    queryFn: () => getDailyStats(subDays(new Date(), 7), new Date()),
  });

  // Get last 30 days data for LineChart
  const { data: monthlyStats } = useQuery({
    queryKey: analyticsKeys.daily(subDays(new Date(), 30), new Date()),
    queryFn: () => getDailyStats(subDays(new Date(), 30), new Date()),
  });

  // Get year heatmap data
  const { data: heatmapData } = useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn: getYearHeatmap,
  });

  // Get user total stats
  const { data: userStats } = useQuery({
    queryKey: analyticsKeys.userTotal(),
    queryFn: getUserTotalStats,
  });

  // Transform data for charts
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Analytics</Text>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard
          value={userStats?.total_ayat ?? 0}
          label='Total Ayat'
          icon='📖'
          color={colors.primary}
        />
        <StatCard
          value={userStats?.current_streak ?? 0}
          label='Current Streak'
          icon='🔥'
          color='#FF8A65'
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          value={userStats?.total_sessions ?? 0}
          label='Sessions'
          icon='📚'
          color='#FFB627'
        />
        <StatCard
          value={userStats?.longest_streak ?? 0}
          label='Longest Streak'
          icon='⭐'
          color={colors.primary}
        />
      </View>

      {/* Weekly Bar Chart */}
      <BarChart data={barChartData} title='Minggu Ini' color={colors.primary} />

      {/* Monthly Line Chart */}
      <LineChart
        data={lineChartData}
        title='30 Hari Terakhir'
        color='#FF8A65'
      />

      {/* Year Heatmap */}
      <Heatmap data={heatmapData ?? []} title='Aktivitas Tahun Ini' />
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
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
});
