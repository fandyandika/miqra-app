import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { colors } from '@/theme/colors';

type StreakCalendarProps = {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  checkinData: Array<{
    date: string;
    ayat_count: number;
  }>;
  streakData: {
    current: number;
    last_date: string | null;
  };
};

export function StreakCalendar({
  currentMonth,
  onMonthChange,
  checkinData,
  streakData,
}: StreakCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of checkin data for quick lookup
  const checkinMap = (checkinData || []).reduce(
    (acc, checkin) => {
      acc[checkin.date] = checkin.ayat_count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate streak for each day (backwards from that date)
  const getDayStreak = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const checkinCount = checkinMap[dateStr] || 0;

    if (checkinCount === 0) return 0;

    // Calculate streak backwards from this date - start from day 1
    let streak = 1; // First day always counts as streak 1
    let currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1); // Start checking from previous day

    // Check consecutive days backwards
    while (true) {
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');
      const hasCheckin =
        checkinMap[currentDateStr] && checkinMap[currentDateStr] > 0;

      if (hasCheckin) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getDayEmoji = (date: Date): string => {
    const checkinCount = checkinMap[format(date, 'yyyy-MM-dd')] || 0;

    if (checkinCount === 0) return '';

    // Check if this day is part of a consecutive sequence
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check if there's a checkin the day before
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = format(prevDay, 'yyyy-MM-dd');
    const hasPrevDay = checkinMap[prevDayStr] && checkinMap[prevDayStr] > 0;

    // Check if there's a checkin the day after
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = format(nextDay, 'yyyy-MM-dd');
    const hasNextDay = checkinMap[nextDayStr] && checkinMap[nextDayStr] > 0;

    // Show emoji only if this day is part of a consecutive sequence
    // (either has a day before or after with checkin)
    if (hasPrevDay || hasNextDay) {
      return '*';
    }

    return '';
  };

  const getDayStyle = (date: Date) => {
    const checkinCount = checkinMap[format(date, 'yyyy-MM-dd')] || 0;
    const streak = getDayStreak(date);
    const isCurrentDay = isToday(date);

    if (checkinCount === 0) {
      return {
        ...styles.day,
        backgroundColor: isCurrentDay ? '#F3F4F6' : 'transparent',
        borderColor: isCurrentDay ? colors.primary : '#E5E7EB',
      };
    }

    // Different colors based on streak length
    let backgroundColor = '#E5F7F0'; // Light green base
    let borderColor = colors.primary;

    if (streak >= 100) {
      backgroundColor = '#FCE7F3'; // Pink for 100+ days
      borderColor = colors.primary; // Use primary color instead of custom pink
    } else if (streak >= 30) {
      backgroundColor = '#FEF3C7'; // Gold for 30+ days
      borderColor = colors.primary; // Use primary color instead of custom gold
    } else if (streak >= 7) {
      backgroundColor = '#DBEAFE'; // Blue for 7+ days
      borderColor = colors.primary; // Use primary color instead of custom blue
    }

    return {
      ...styles.day,
      backgroundColor,
      borderColor,
      borderWidth: 2,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekDays}>
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'].map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendar}>
        {/* Add empty cells for days before month start (Monday = 0) */}
        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map(
          (_, index) => (
            <View key={`empty-${index}`} style={styles.dayContainer} />
          )
        )}

        {days.map((day, index) => {
          const dayOfWeek = day.getDay();
          const isFirstWeek = index < 7;
          const isLastWeek = index >= days.length - 7;

          return (
            <View
              key={day.toISOString()}
              style={[
                styles.dayContainer,
                isFirstWeek && styles.firstWeek,
                isLastWeek && styles.lastWeek,
              ]}
            >
              <Pressable
                style={getDayStyle(day)}
                accessibilityLabel={`${format(day, 'd MMMM yyyy', { locale: id })} - ${checkinMap[format(day, 'yyyy-MM-dd')] || 0} ayat dibaca`}
              >
                <Text
                  style={[styles.dayNumber, isToday(day) && styles.todayText]}
                >
                  {format(day, 'd')}
                </Text>

                {checkinMap[format(day, 'yyyy-MM-dd')] && (
                  <Text style={styles.ayatCount}>
                    {checkinMap[format(day, 'yyyy-MM-dd')]}
                  </Text>
                )}

                <Text style={styles.emoji}>{getDayEmoji(day)}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  firstWeek: {
    // Add any special styling for first week
  },
  lastWeek: {
    // Add any special styling for last week
  },
  day: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  ayatCount: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    color: colors.primary,
    fontWeight: '600',
  },
  emoji: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
