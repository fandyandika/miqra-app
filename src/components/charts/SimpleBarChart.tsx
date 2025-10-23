import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/theme/colors';

type DataPoint = {
  label: string;
  value: number;
  goal?: number;
  isGoalMet?: boolean;
  status?: string;
};

type BarChartProps = {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64; // Account for padding

export function BarChart({ data, title, color = colors.primary, height = 220 }: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Belum ada data</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = Math.min(40, CHART_WIDTH / (data.length * 2));
  const barSpacing = (CHART_WIDTH - data.length * barWidth) / (data.length + 1);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={[styles.chartContainer, { height: height - (title ? 40 : 0) }]}>
        {/* Y-axis - removed numerical labels for cleaner look */}
        <View style={styles.yAxis}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View key={index} style={styles.yAxisLine} />
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 80);
            const barColor = item.value > 0 ? color : colors.gray[300];

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2),
                      backgroundColor: barColor,
                      width: barWidth,
                    },
                  ]}
                />
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.barValue}>{item.value.toLocaleString('id-ID')}</Text>
                {/* Goal status for day view */}
                {item.status && (
                  <Text
                    style={[styles.goalStatus, { color: item.isGoalMet ? '#10B981' : '#EF4444' }]}
                  >
                    {item.status}
                  </Text>
                )}
                {/* Goal info for day view */}
                {item.goal && <Text style={styles.goalInfo}>Target: {item.goal} ayat</Text>}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
    height: '100%',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  yAxisLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 4,
    marginBottom: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 60,
  },
  barValue: {
    fontSize: 9,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  goalInfo: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
  },
});
