import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/theme/colors';

type DataPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

export function LineChart({
  data,
  title,
  color = colors.accent,
  height = 220,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>Belum ada data</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue;

  // Create SVG path for line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * (CHART_WIDTH - 80);
    const y =
      valueRange > 0
        ? ((maxValue - item.value) / valueRange) * (height - 100)
        : (height - 100) / 2;
    return { x, y, value: item.value, label: item.label };
  });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View
        style={[styles.chartContainer, { height: height - (title ? 40 : 0) }]}
      >
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {Math.round(minValue + valueRange * ratio).toLocaleString(
                'id-ID'
              )}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[styles.gridLine, { top: (height - 100) * ratio + 20 }]}
            />
          ))}

          {/* Line and dots */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => (
              <View key={index}>
                {/* Line to next point */}
                {index < points.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      {
                        left: point.x,
                        top: point.y + 10,
                        width: Math.sqrt(
                          Math.pow(points[index + 1].x - point.x, 2) +
                            Math.pow(points[index + 1].y - point.y, 2)
                        ),
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              points[index + 1].y - point.y,
                              points[index + 1].x - point.x
                            )}rad`,
                          },
                        ],
                        backgroundColor: color,
                      },
                    ]}
                  />
                )}

                {/* Data point */}
                <View
                  style={[
                    styles.dataPoint,
                    {
                      left: point.x - 4,
                      top: point.y + 6,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {points.map((point, index) => (
              <Text key={index} style={styles.xAxisLabel}>
                {point.label}
              </Text>
            ))}
          </View>
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
  chartArea: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 20,
  },
  line: {
    position: 'absolute',
    height: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 60,
  },
});
