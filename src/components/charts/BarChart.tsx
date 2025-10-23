import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { colors } from '@/theme/colors';

type DataPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64; // Account for padding

export function BarChart({
  data,
  title,
  color = colors.primary,
  height = 220,
}: BarChartProps) {
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

  // Transform data for Victory
  const chartData = data.map((d, index) => ({
    x: d.label,
    y: d.value,
    index,
  }));

  const maxValue = Math.max(...data.map(d => d.value));
  const yAxisMax = Math.ceil(maxValue * 1.1); // 10% padding

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
        <Text style={styles.placeholderSubtext}>Victory Native not available</Text>
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
  placeholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
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
});
