import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { colors } from '@/theme/colors';

type CalendarViewProps = {
  date: Date;
  calendarData: Record<string, { count: number; ayatCount: number }>;
  onDayPress?: (date: string) => void;
  weekStartsOn?: 0 | 1; // default Sunday(0)
};

export function CalendarView({ date, calendarData, onDayPress, weekStartsOn = 0 }: CalendarViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = weekStartsOn === 1 ? ['Sen','Sel','Rab','Kam','Jum','Sab','Min'] : ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  return (
    <View style={styles.container}>
      {/* Headers */}
      <View style={styles.weekRow}>
        {weekDays.map((w) => (
          <View key={w} style={styles.dayCellHeader}>
            <Text style={styles.weekDayText}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Days */}
      <View style={styles.daysGrid}>
        {days.map((d) => {
          const ds = format(d, 'yyyy-MM-dd');
          const item = calendarData[ds];
          const inMonth = isSameMonth(d, date);
          const active = !!item;

          return (
            <Pressable
              key={ds}
              onPress={() => onDayPress?.(ds)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${format(d, 'd MMMM', { locale: id })}${active ? `, ${item.ayatCount} ayat` : ''}`}
              style={[
                styles.dayCell,
                !inMonth && styles.otherMonthDay,
                active && styles.activeDay,
              ]}
            >
              <Text style={[
                styles.dayNumber,
                !inMonth && styles.otherMonthText,
                active && styles.activeText,
              ]}>
                {format(d, 'd')}
              </Text>
              {active && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellHeader: { width: '14.28%', alignItems: 'center', justifyContent: 'center' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: 8 },
  weekDayText: { fontSize: 12, fontWeight: '600', color: colors.neutral },
  dayNumber: { fontSize: 14 },
  otherMonthDay: { opacity: 0.35 },
  otherMonthText: { color: colors.neutral },
  activeDay: { backgroundColor: colors.primarySoft },
  activeText: { color: colors.primary, fontWeight: '700' },
  dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
});


