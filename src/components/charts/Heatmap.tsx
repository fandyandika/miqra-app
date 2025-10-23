import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/theme/colors';

type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

type HeatmapProps = {
  data: HeatmapDay[];
  title?: string;
};

const CELL_SIZE = 12;
const CELL_GAP = 3;

const LEVEL_COLORS = {
  0: '#EBEDF0',
  1: colors.primary + '30',
  2: colors.primary + '60',
  3: colors.primary + '90',
  4: colors.primary,
};

export function Heatmap({ data, title }: HeatmapProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyText}>Belum ada data heatmap</Text>
        </View>
      </View>
    );
  }

  // Group data into weeks (7 days each)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  // Pad start to align with Sunday
  const firstDayOfWeek = new Date(data[0].date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0, level: 0 });
  }

  data.forEach((day, index) => {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Pad end if incomplete week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: 0, level: 0 });
    }
    weeks.push(currentWeek);
  }

  // Month labels (show first day of each month)
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    week.forEach((day) => {
      if (day.date) {
        const month = new Date(day.date).getMonth();
        if (month !== lastMonth) {
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'Mei',
            'Jun',
            'Jul',
            'Agu',
            'Sep',
            'Okt',
            'Nov',
            'Des',
          ];
          monthLabels.push({ week: weekIndex, label: monthNames[month] });
          lastMonth = month;
        }
      }
    });
  });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            {monthLabels.map((ml, idx) => (
              <Text
                key={idx}
                style={[styles.monthLabel, { left: ml.week * (CELL_SIZE + CELL_GAP) }]}
              >
                {ml.label}
              </Text>
            ))}
          </View>

          {/* Day labels */}
          <View style={styles.row}>
            <View style={styles.dayLabels}>
              {['M', 'R', 'K', 'J', 'S'].map((day, idx) => (
                <Text key={idx} style={styles.dayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Heatmap grid */}
            <View style={styles.grid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((day, dayIndex) => (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: day.date ? LEVEL_COLORS[day.level] : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Sedikit</Text>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <View key={level} style={[styles.legendCell, { backgroundColor: LEVEL_COLORS[level] }]} />
        ))}
        <Text style={styles.legendText}>Banyak</Text>
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
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  monthLabels: {
    height: 20,
    marginBottom: 4,
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 20,
    justifyContent: 'space-around',
    marginRight: 8,
  },
  dayLabel: {
    fontSize: 9,
    color: '#6B7280',
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  week: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  emptyState: {
    height: 150,
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
