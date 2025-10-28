import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

import { colors } from '@/theme/colors';
import { useAuthSession } from '@/hooks/useAuth';
import { getReadingStats, getCalendarData, getRecentReadingSessions } from '@/services/reading';
import { getHasanatStats } from '@/services/hasanat';
import { getSettings } from '@/services/profile';
import { StreakCalendar } from '@/features/reading/StreakCalendar';
import { StatsCard } from '@/features/reading/StatsCard';
import { supabase } from '@/lib/supabase';

export default function ProgressScreen() {
  const navigation = useNavigation();
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const user = session?.user;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // REAL-TIME SYNC for Progress Screen (same pattern as HomeScreen)
  useEffect(() => {
    if (!user) return;

    console.log('[ProgressScreen] Setting up real-time sync for user:', user.id);

    const channel = supabase
      .channel('progress-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
        console.log('[ProgressScreen] 🔥 Checkins updated, invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['checkin'] });
        queryClient.invalidateQueries({ queryKey: ['streak'] });
        queryClient.invalidateQueries({ queryKey: ['reading'] });
        queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
        queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-reading-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['khatam'] });
        queryClient.invalidateQueries({ queryKey: ['families'] });
        queryClient.invalidateQueries({ queryKey: ['hasanat'] });
        // Force refetch for immediate UI update
        queryClient.refetchQueries({
          queryKey: ['reading-stats', selectedPeriod, format(currentMonth, 'yyyy-MM')],
        });
        queryClient.refetchQueries({
          queryKey: ['checkin-data', format(currentMonth, 'yyyy-MM')],
        });
        queryClient.refetchQueries({ queryKey: ['recent-reading-sessions'] });
        queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
        queryClient.refetchQueries({ queryKey: ['reading', 'progress'] });
        queryClient.refetchQueries({ queryKey: ['reading', 'today'] });
        queryClient.refetchQueries({ queryKey: ['khatam', 'progress'] });
        queryClient.refetchQueries({ queryKey: ['hasanat', 'stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_sessions' }, () => {
        console.log('[ProgressScreen] 📚 Reading sessions updated, invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['reading'] });
        queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
        queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-reading-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['khatam'] });
        queryClient.invalidateQueries({ queryKey: ['hasanat'] });
        // Force refetch for immediate UI update
        queryClient.refetchQueries({
          queryKey: ['reading-stats', selectedPeriod, format(currentMonth, 'yyyy-MM')],
        });
        queryClient.refetchQueries({
          queryKey: ['checkin-data', format(currentMonth, 'yyyy-MM')],
        });
        queryClient.refetchQueries({ queryKey: ['recent-reading-sessions'] });
        queryClient.refetchQueries({ queryKey: ['reading', 'progress'] });
        queryClient.refetchQueries({ queryKey: ['reading', 'today'] });
        queryClient.refetchQueries({ queryKey: ['khatam', 'progress'] });
        queryClient.refetchQueries({ queryKey: ['hasanat', 'stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streaks' }, () => {
        console.log('[ProgressScreen] 🔥 Streaks updated, invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['streak'] });
        queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
        // Force refetch for immediate UI update
        queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
        queryClient.refetchQueries({
          queryKey: ['reading-stats', selectedPeriod, format(currentMonth, 'yyyy-MM')],
        });
      })
      .subscribe();

    return () => {
      console.log('[ProgressScreen] Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, selectedPeriod, currentMonth]);

  // Ensure fresh data when screen gains focus (e.g., switching tabs)
  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      const monthKey = format(currentMonth, 'yyyy-MM');

      // Invalidate + refetch Progress-specific queries
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
      queryClient.invalidateQueries({ queryKey: ['recent-reading-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['hasanat'] });

      queryClient.refetchQueries({ queryKey: ['reading-stats', selectedPeriod, monthKey] });
      queryClient.refetchQueries({ queryKey: ['checkin-data', monthKey] });
      queryClient.refetchQueries({ queryKey: ['recent-reading-sessions'] });
      queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
      queryClient.refetchQueries({ queryKey: ['hasanat', 'stats'] });
    }, [user, selectedPeriod, currentMonth, queryClient])
  );

  // Fetch reading stats based on selected period
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reading-stats', selectedPeriod, format(currentMonth, 'yyyy-MM')],
    queryFn: () => {
      let start: Date, end: Date;

      if (selectedPeriod === 'day') {
        // Today only
        const today = new Date();
        start = today;
        end = today;
      } else if (selectedPeriod === 'week') {
        // Current week
        const today = new Date();
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      } else if (selectedPeriod === 'month') {
        // Current month
        start = startOfMonth(currentMonth);
        end = endOfMonth(currentMonth);
      } else {
        // Current year
        start = new Date(currentMonth.getFullYear(), 0, 1);
        end = new Date(currentMonth.getFullYear(), 11, 31);
      }

      return getReadingStats(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    },
    enabled: !!user,
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
  });

  // Fetch checkin data for calendar
  const { data: checkinData, isLoading: checkinLoading } = useQuery({
    queryKey: ['checkin-data', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getCalendarData(currentMonth),
    enabled: !!user,
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
  });

  // Fetch recent reading sessions for reading list
  const { data: readingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-reading-sessions'],
    queryFn: () => getRecentReadingSessions(10),
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Get user settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 300_000,
  });

  // Fetch hasanat stats (only if hasanat_visible is true)
  const { data: hasanatStats, isLoading: hasanatLoading } = useQuery({
    queryKey: ['hasanat', 'stats'],
    queryFn: getHasanatStats,
    enabled: !!user && settings?.hasanat_visible === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Navigation functions
  const handleViewDetailedStats = () => {
    navigation.navigate('Stats' as never);
  };

  const handleTrackRecordKhatam = () => {
    navigation.navigate('KhatamProgress' as never);
  };

  // Handle reading list item expand/collapse
  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Format time for session display
  const formatSessionTime = (sessionTime: string) => {
    try {
      return format(new Date(sessionTime), 'HH:mm', { locale: id });
    } catch {
      return '--:--';
    }
  };

  // Get surah name from number
  const getSurahName = (surahNumber: number) => {
    const surahNames: { [key: number]: string } = {
      1: 'Al-Fatihah',
      2: 'Al-Baqarah',
      3: 'Ali Imran',
      4: 'An-Nisa',
      5: 'Al-Maidah',
      // Add more as needed
    };
    return surahNames[surahNumber] || `Surah ${surahNumber}`;
  };

  // Get last reading info from reading sessions
  const lastReading = useMemo(() => {
    if (!readingSessions || !Array.isArray(readingSessions) || readingSessions.length === 0)
      return null;

    // Get the most recent reading session
    const lastSession = readingSessions[0];
    if (!lastSession.sessions || lastSession.sessions.length === 0) return null;

    // Get the last session of the most recent day
    const lastSessionDetail = lastSession.sessions[lastSession.sessions.length - 1];

    return {
      date: lastSession.date,
      ayat_count: lastSession.ayat_count,
      surah_number: lastSessionDetail.surah_number,
      surah_name: getSurahName(lastSessionDetail.surah_number),
      ayat_start: lastSessionDetail.ayat_start,
      ayat_end: lastSessionDetail.ayat_end,
    };
  }, [readingSessions]);

  // Get reading list for current month
  const readingList = useMemo(() => {
    if (!checkinData || !Array.isArray(checkinData)) return [];

    return checkinData
      .filter((item) => item.ayat_count > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show last 10 readings
  }, [checkinData]);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const isLoading = statsLoading || checkinLoading || hasanatLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Progress Bacaan</Text>
        <Text style={styles.heroSubtitle}>Pantau kemajuan dan konsistensi bacaan Al-Quran</Text>
      </View>

      {/* Monthly Stats - Moved to top */}
      <View style={styles.monthlyStatsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistik</Text>
          <View style={styles.periodSelector}>
            <Pressable
              style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('day')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'day' && styles.periodButtonTextActive,
                ]}
              >
                Hari
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'week' && styles.periodButtonTextActive,
                ]}
              >
                Minggu
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'month' && styles.periodButtonTextActive,
                ]}
              >
                Bulan
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('year')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'year' && styles.periodButtonTextActive,
                ]}
              >
                Tahun
              </Text>
            </Pressable>
          </View>
        </View>
        <StatsCard
          totalAyat={stats?.totalAyat || 0}
          daysRead={stats?.daysRead || 0}
          avgPerDay={stats?.avgPerDay || 0}
          period={selectedPeriod as 'day' | 'week' | 'month' | 'year'}
        />
      </View>

      {/* Hasanat Stats Card - Only if hasanat_visible is true */}
      {settings?.hasanat_visible && hasanatStats && (
        <View style={styles.hasanatSection}>
          <View style={styles.hasanatCard}>
            <View style={styles.hasanatHeader}>
              <Text style={styles.hasanatIcon}>🌟</Text>
              <Text style={styles.hasanatTitle}>Hasanat</Text>
            </View>
            <View style={styles.hasanatStats}>
              <View style={styles.hasanatStatItem}>
                <Text style={styles.hasanatStatValue}>
                  {hasanatStats.total_hasanat.toLocaleString('id-ID')}
                </Text>
                <Text style={styles.hasanatStatLabel}>Total Hasanat</Text>
              </View>
              <View style={styles.hasanatStatItem}>
                <Text style={styles.hasanatStatValue}>
                  {hasanatStats.total_letters.toLocaleString('id-ID')}
                </Text>
                <Text style={styles.hasanatStatLabel}>Huruf Dibaca</Text>
              </View>
              <View style={styles.hasanatStatItem}>
                <Text style={styles.hasanatStatValue}>{hasanatStats.streak_days}</Text>
                <Text style={styles.hasanatStatLabel}>Hari Berturut</Text>
              </View>
              <View style={styles.hasanatStatItem}>
                <Text style={styles.hasanatStatValue}>{hasanatStats.daily_average}</Text>
                <Text style={styles.hasanatStatLabel}>Rata-rata/Hari</Text>
              </View>
            </View>
            <Text style={styles.hasanatFooter}>💫 Setiap huruf = 10 hasanat</Text>
          </View>
        </View>
      )}

      {/* Action Cards - Moved above calendar */}
      <View style={styles.actionSection}>
        <View style={styles.actionCards}>
          <Pressable style={styles.actionCard} onPress={handleViewDetailedStats}>
            <View style={styles.actionCardIcon}>
              <Text style={styles.actionCardIconText}>📊</Text>
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Lihat Statistik Detail</Text>
              <Text style={styles.actionCardSubtitle}>Lihat trend, pola bacaan, dan insight</Text>
            </View>
            <Text style={styles.actionCardArrow}>&rarr;</Text>
          </Pressable>

          <Pressable style={styles.actionCard} onPress={handleTrackRecordKhatam}>
            <View style={styles.actionCardIcon}>
              <Text style={styles.actionCardIconText}>🎯</Text>
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Track Record Khatam</Text>
              <Text style={styles.actionCardSubtitle}>Pantau progress khatam Al-Quran</Text>
            </View>
            <Text style={styles.actionCardArrow}>&rarr;</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <View style={styles.actionCardIcon}>
              <Text style={styles.actionCardIconText}>📖</Text>
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Terakhir Baca</Text>
              <Text style={styles.actionCardSubtitle}>
                {lastReading
                  ? `QS [${lastReading.surah_number}] ${lastReading.surah_name} : ${lastReading.ayat_end}`
                  : 'Belum ada data bacaan'}
              </Text>
            </View>
            <View style={styles.continueReadingIndicator}>
              <MaterialCommunityIcons name="play-circle" size={24} color={colors.primary} />
              <Text style={styles.continueReadingText}>Lanjut</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <StreakCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          checkinData={Array.isArray(checkinData) ? checkinData : []}
          readingSessions={
            Array.isArray(readingSessions)
              ? readingSessions.map((session) => ({
                  date: session.date,
                  surah_name: session.surah_name,
                  surah_number: 1, // Default value since it's not in the data
                  ayat_start: Number(session.ayat_start) || 1,
                  ayat_end: Number(session.ayat_end) || 1,
                }))
              : []
          }
          streakData={{
            current: stats?.daysRead || 0,
            last_date: null,
          }}
        />
      </View>

      {/* Reading List Section - Card Version */}
      <View style={styles.readingListSection}>
        <Text style={styles.sectionTitle}>Daftar Bacaan</Text>
        <View style={styles.readingList}>
          {sessionsLoading ? (
            <View style={styles.readingListLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.readingListLoadingText}>Memuat data bacaan...</Text>
            </View>
          ) : Array.isArray(readingSessions) && readingSessions.length > 0 ? (
            readingSessions.map((session, index) => {
              const isExpanded = expandedItems.has(index);
              return (
                <View key={index} style={styles.readingItemContainer}>
                  <Pressable style={styles.readingItem} onPress={() => toggleExpanded(index)}>
                    <View style={styles.readingItemLeft}>
                      <Text style={styles.readingItemDate}>
                        {format(new Date(session.date), 'dd MMM', {
                          locale: id,
                        })}
                      </Text>
                      <Text style={styles.readingItemDay}>
                        {format(new Date(session.date), 'EEEE', { locale: id })}
                      </Text>
                    </View>
                    <View style={styles.readingItemRight}>
                      <Text style={styles.readingItemAyat}>{session.ayat_count} ayat</Text>
                      <Text style={styles.readingItemSessions}>{session.session_count} sesi</Text>
                    </View>
                    <View style={styles.readingItemArrow}>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.text.secondary}
                      />
                    </View>
                  </Pressable>

                  {/* Dropdown Content */}
                  {isExpanded && (
                    <View style={styles.dropdownContent}>
                      {session.sessions.map((sessionDetail: any, sessionIndex: number) => (
                        <View key={sessionDetail.id} style={styles.sessionDetail}>
                          <Text style={styles.sessionDetailText}>
                            Sesi {sessionIndex + 1}: QS. {getSurahName(sessionDetail.surah_number)}{' '}
                            {sessionDetail.ayat_start}-{sessionDetail.ayat_end} (
                            {formatSessionTime(sessionDetail.session_time)} WIB)
                          </Text>
                          {sessionDetail.notes && (
                            <Text style={styles.sessionNotes}>Catatan: {sessionDetail.notes}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyReadingList}>
              <Text style={styles.emptyReadingListText}>Belum ada data bacaan</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 70,
    backgroundColor: colors.primary,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  calendarSection: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  monthlyStatsSection: {
    margin: 16,
    marginTop: 0,
  },
  actionSection: {
    margin: 16,
    marginTop: 0,
  },
  actionCards: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionCardIconText: {
    fontSize: 24,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionCardArrow: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  continueReadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueReadingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  // New styles for reorganized layout
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#00C896',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  lastReadingSection: {
    margin: 16,
    marginBottom: 8,
  },
  lastReadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  lastReadingCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastReadingInfo: {
    flex: 1,
  },
  lastReadingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lastReadingSurah: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  lastReadingStats: {
    alignItems: 'flex-end',
  },
  lastReadingAyat: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  lastReadingRange: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  readingListSection: {
    margin: 16,
    marginTop: 8,
  },
  readingList: {
    gap: 8,
  },
  readingItemContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  readingItemArrow: {
    marginLeft: 8,
  },
  dropdownContent: {
    backgroundColor: colors.gray[50],
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionDetail: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionDetailText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  sessionNotes: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  readingItemLeft: {
    flex: 1,
  },
  readingItemDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  readingItemDay: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  readingItemRight: {
    alignItems: 'flex-end',
  },
  readingItemAyat: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  readingItemSessions: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyReadingList: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyReadingListText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  readingListLoadingContainer: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  readingListLoadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  // Hasanat styles
  hasanatSection: {
    margin: 16,
    marginTop: 0,
  },
  hasanatCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hasanatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hasanatIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  hasanatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  hasanatStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hasanatStatItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  hasanatStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  hasanatStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hasanatFooter: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
});
