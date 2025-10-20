import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { getMonthSessions, getReadingStats, getCalendarData, groupSessionsByDate } from '@/services/reading';
import { CalendarView } from './CalendarView';
import { StatsCard } from './StatsCard';
import { SURAH_META } from '@/data/quran_meta';
import { colors } from '@/theme/colors';

export default function ReadingHistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = format(currentMonth, 'yyyy-MM');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['reading', 'history', monthKey],
    queryFn: () => getMonthSessions(currentMonth),
  });

  const { data: stats } = useQuery({
    queryKey: ['reading', 'stats', monthKey],
    queryFn: () => {
      const start = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), 'yyyy-MM-dd');
      const end = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), 'yyyy-MM-dd');
      return getReadingStats(start, end);
    },
    enabled: !!sessions,
  });

  const { data: calendarData } = useQuery({
    queryKey: ['reading', 'calendar', monthKey],
    queryFn: () => getCalendarData(currentMonth),
    enabled: !!sessions,
  });

  const grouped = sessions ? groupSessionsByDate(sessions) : [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Memuat riwayat…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={styles.monthBtn}
          accessibilityRole="button"
          accessibilityLabel="Bulan sebelumnya"
        >
          <Text style={styles.monthBtnText}>←</Text>
        </Pressable>
        <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy', { locale: id })}</Text>
        <Pressable
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={styles.monthBtn}
          accessibilityRole="button"
          accessibilityLabel="Bulan berikutnya"
        >
          <Text style={styles.monthBtnText}>→</Text>
        </Pressable>
      </View>

      {stats && (
        <StatsCard
          totalAyat={stats.totalAyat}
          daysRead={stats.daysRead}
          avgPerDay={stats.avgPerDay}
          mostReadSurah={stats.mostReadSurah}
        />
      )}

      {calendarData && (
        <View style={{ marginBottom: 16 }}>
          <CalendarView date={currentMonth} calendarData={calendarData} />
        </View>
      )}

      <View>
        <Text style={styles.sectionTitle}>Daftar Bacaan</Text>
        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.muted}>Belum ada catatan bacaan bulan ini.</Text>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.date} style={{ marginBottom: 16 }}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {format(new Date(g.date), 'EEEE, d MMMM yyyy', { locale: id })}
                </Text>
                <Text style={styles.dateTotal}>{g.totalAyat} ayat</Text>
              </View>

              {g.sessions.map((s: any) => {
                const meta = SURAH_META[s.surah_number - 1];
                return (
                  <View key={s.id} style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        {s.surah_number}. {meta?.name || '—'}
                      </Text>
                      <Text style={styles.itemSub}>Ayat {s.ayat_start}-{s.ayat_end}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.itemCount}>{s.ayat_count} ayat</Text>
                      <Text style={styles.itemTime}>
                        {new Date(s.session_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  muted: { color: colors.neutral, marginTop: 8, fontSize: 14 },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthBtn: { backgroundColor: colors.surface, padding: 8, borderRadius: 8, minWidth: 44, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  monthBtnText: { fontSize: 20, color: colors.primary },
  monthText: { fontSize: 18, fontWeight: '700', color: (colors as any).text?.primary ?? '#111827', textTransform: 'capitalize' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: (colors as any).text?.primary ?? '#111827', marginBottom: 12 },
  empty: { backgroundColor: colors.surface, borderRadius: 12, padding: 28, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },

  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dateText: { fontSize: 14, fontWeight: '600', color: (colors as any).text?.primary ?? '#111827', textTransform: 'capitalize' },
  dateTotal: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  item: { backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  itemTitle: { fontSize: 14, fontWeight: '600', color: (colors as any).text?.primary ?? '#111827' },
  itemSub: { fontSize: 12, color: colors.neutral },
  itemCount: { fontSize: 14, fontWeight: '700', color: colors.primary },
  itemTime: { fontSize: 11, color: colors.neutral },
});


