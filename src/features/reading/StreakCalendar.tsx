import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type StreakCalendarProps = {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  checkinData: {
    date: string;
    ayat_count: number;
  }[];
  readingSessions?: {
    date: string;
    surah_name: string;
    surah_number: number;
    ayat_start: number;
    ayat_end: number;
  }[];
  streakData: {
    current: number;
    last_date: string | null;
  };
};

export function StreakCalendar({
  currentMonth,
  onMonthChange,
  checkinData,
  readingSessions = [],
  streakData,
}: StreakCalendarProps) {
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - 40) / 7; // 40 for padding

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get the start of the week containing the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Monday
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Create a map for quick lookup
  const checkinMap = useMemo(() => {
    console.log('📅 StreakCalendar - checkinData received:', checkinData);
    const map = new Map();
    checkinData.forEach((checkin) => {
      console.log(`📅 Mapping date ${checkin.date} -> ${checkin.ayat_count} ayat`);
      map.set(checkin.date, checkin.ayat_count);
    });
    console.log('📅 StreakCalendar - checkinMap created:', Array.from(map.entries()));
    return map;
  }, [checkinData]);

  const readingSessionsMap = useMemo(() => {
    const map = new Map();
    readingSessions.forEach((session) => {
      const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(session);
    });
    return map;
  }, [readingSessions]);

  const getStreakStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasReading = checkinMap.has(dateStr);

    if (!hasReading) return 'none';

    // Calculate consecutive reading days from this date
    let consecutiveDays = 0;
    const currentDate = new Date(date);

    // Check backwards for consecutive days
    while (checkinMap.has(format(currentDate, 'yyyy-MM-dd'))) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    if (consecutiveDays >= 100) return 'very-long';
    if (consecutiveDays >= 30) return 'long';
    if (consecutiveDays >= 7) return 'medium';
    return 'short';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    onMonthChange(newMonth);
  };

  const getDayStyle = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasReading = checkinMap.has(dateStr);
    const isCurrentDay = isToday(date);
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const streakStatus = getStreakStatus(date);

    if (!isCurrentMonth) {
      return [styles.dayContainer, styles.otherMonthDay];
    }

    if (hasReading) {
      return [
        styles.dayContainer,
        styles.readingDay,
        streakStatus === 'short' && styles.shortStreak,
        streakStatus === 'medium' && styles.mediumStreak,
        streakStatus === 'long' && styles.longStreak,
        streakStatus === 'very-long' && styles.veryLongStreak,
      ];
    }

    if (isCurrentDay) {
      return [styles.dayContainer, styles.today];
    }

    return [styles.dayContainer, styles.emptyDay];
  };

  const getDayTextStyle = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasReading = checkinMap.has(dateStr);
    const isCurrentDay = isToday(date);
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

    if (!isCurrentMonth) {
      return [styles.dayText, styles.otherMonthText];
    }

    if (hasReading) {
      return [styles.dayText, styles.readingDayText];
    }

    if (isCurrentDay) {
      return [styles.dayText, styles.todayText];
    }

    return [styles.dayText, styles.emptyDayText];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy', { locale: id })}</Text>
        <Pressable onPress={() => navigateMonth('next')} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Days of week */}
      <View style={styles.weekDaysContainer}>
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'].map((day, index) => (
          <View key={day} style={styles.weekDayItem}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {daysInCalendar.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const hasReading = checkinMap.has(dateStr);
          const ayatCount = checkinMap.get(dateStr) || 0;
          const sessions = readingSessionsMap.get(dateStr) || [];
          const streakStatus = getStreakStatus(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          // Debug logging for days with reading data
          if (hasReading && isCurrentMonth) {
            console.log(`📅 Day ${format(date, 'd')} (${dateStr}): ${ayatCount} ayat`);
          }

          return (
            <View key={dateStr} style={styles.dayWrapper}>
              <View style={getDayStyle(date)}>
                <Text style={getDayTextStyle(date)}>{format(date, 'd')}</Text>
                {hasReading && isCurrentMonth && (
                  <>
                    <Text style={styles.ayatCount}>{ayatCount}a</Text>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={10}
                      color="#F59E0B"
                      style={styles.streakIcon}
                    />
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.readingDayColor]} />
          <Text style={styles.legendText}>Baca hari ini</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.shortStreakColor]} />
          <Text style={styles.legendText}>Streak 7+ hari</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.mediumStreakColor]} />
          <Text style={styles.legendText}>Streak 30+ hari</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.longStreakColor]} />
          <Text style={styles.legendText}>Streak 100+ hari</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayWrapper: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContainer: {
    flex: 1,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDay: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  otherMonthDay: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  readingDay: {
    backgroundColor: '#D1FAE5', // Light green
    borderWidth: 2,
    borderColor: '#10B981', // Green border
    borderRadius: 12,
  },
  today: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  shortStreak: {
    backgroundColor: '#D1FAE5', // Light green for 7+ days
    borderColor: '#10B981',
    borderRadius: 8,
  },
  mediumStreak: {
    backgroundColor: '#FEF3C7', // Light yellow for 30+ days
    borderColor: '#F59E0B',
    borderRadius: 8,
  },
  longStreak: {
    backgroundColor: '#FCE7F3', // Light pink for 100+ days
    borderColor: '#EC4899',
    borderRadius: 8,
  },
  veryLongStreak: {
    backgroundColor: '#FCE7F3', // Light pink for 100+ days
    borderColor: '#EC4899',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDayText: {
    color: '#111827',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  readingDayText: {
    color: '#111827',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  ayatCount: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 8,
    color: '#10B981',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 3,
    minWidth: 14,
    textAlign: 'center',
  },
  streakIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '45%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  readingDayColor: {
    backgroundColor: '#D1FAE5',
  },
  shortStreakColor: {
    backgroundColor: '#D1FAE5',
  },
  mediumStreakColor: {
    backgroundColor: '#FEF3C7',
  },
  longStreakColor: {
    backgroundColor: '#FCE7F3',
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
