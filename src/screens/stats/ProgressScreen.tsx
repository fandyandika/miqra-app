import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';

import { colors } from '@/theme/colors';
import { useAuthSession } from '@/hooks/useAuth';
import { getReadingStats, getCalendarData, getRecentReadingSessions } from '@/services/reading';
import { StreakCalendar } from '@/features/reading/StreakCalendar';
import { StatsCard } from '@/features/reading/StatsCard';

export default function ProgressScreen() {
  const navigation = useNavigation();
  const { session } = useAuthSession();
  const user = session?.user;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Fetch reading stats for current month
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reading-stats', format(currentMonth, 'yyyy-MM')],
    queryFn: () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      return getReadingStats(start, end);
    },
    enabled: !!user,
  });

  // Fetch checkin data for calendar
  const { data: checkinData, isLoading: checkinLoading } = useQuery({
    queryKey: ['checkin-data', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getCalendarData(currentMonth),
    enabled: !!user,
  });

  // Fetch recent reading sessions for reading list
  const { data: readingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-reading-sessions'],
    queryFn: () => getRecentReadingSessions(10),
    enabled: !!user,
  });

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
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
    setExpandedItems(prev => {
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
    if (!readingSessions || !Array.isArray(readingSessions) || readingSessions.length === 0) return null;
    
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
      .filter(item => item.ayat_count > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show last 10 readings
  }, [checkinData]);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const isLoading = statsLoading || checkinLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Progress Bacaan</Text>
        <Text style={styles.heroSubtitle}>
          Pantau kemajuan dan konsistensi bacaan Al-Quran
        </Text>
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
              <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.periodButtonTextActive]}>
                Hari
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
                Minggu
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
                Bulan
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('year')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
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

      {/* Action Cards - Moved above calendar */}
      <View style={styles.actionSection}>
        <View style={styles.actionCards}>
          <Pressable style={styles.actionCard} onPress={handleViewDetailedStats}>
            <View style={styles.actionCardIcon}>
              <Text style={styles.actionCardIconText}>📊</Text>
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Lihat Statistik Detail</Text>
              <Text style={styles.actionCardSubtitle}>
                Lihat trend, pola bacaan, dan insight
              </Text>
            </View>
            <Text style={styles.actionCardArrow}>&rarr;</Text>
          </Pressable>

          <Pressable style={styles.actionCard} onPress={handleTrackRecordKhatam}>
            <View style={styles.actionCardIcon}>
              <Text style={styles.actionCardIconText}>🎯</Text>
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Track Record Khatam</Text>
              <Text style={styles.actionCardSubtitle}>
                Pantau progress khatam Al-Quran
              </Text>
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
                {lastReading ? 
                  `QS [${lastReading.surah_number}] ${lastReading.surah_name} : ${lastReading.ayat_end}` :
                  'Belum ada data bacaan'
                }
              </Text>
            </View>
            <View style={styles.continueReadingIndicator}>
              <MaterialCommunityIcons 
                name="play-circle" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.continueReadingText}>Lanjut</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Last Reading Info - Above Calendar */}
      {lastReading && (
        <View style={styles.lastReadingSection}>
          <Text style={styles.lastReadingTitle}>Terakhir Baca</Text>
          <View style={styles.lastReadingCard}>
            <View style={styles.lastReadingInfo}>
              <Text style={styles.lastReadingDate}>
                {format(new Date(lastReading.date), 'dd MMMM yyyy', { locale: id })}
              </Text>
              <Text style={styles.lastReadingSurah}>
                {lastReading.surah_name || 'Surah tidak diketahui'}
              </Text>
            </View>
            <View style={styles.lastReadingStats}>
              <Text style={styles.lastReadingAyat}>
                {lastReading.ayat_count} ayat
              </Text>
              <Text style={styles.lastReadingRange}>
                Ayat {lastReading.ayat_start || 1} - {lastReading.ayat_end || lastReading.ayat_count}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <View style={styles.monthNavigation}>
            <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
              <Text style={styles.navButtonText}>&lt;</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </Text>
            <Pressable style={styles.navButton} onPress={goToNextMonth}>
              <Text style={styles.navButtonText}>&gt;</Text>
            </Pressable>
          </View>
        </View>
        <StreakCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          checkinData={Array.isArray(checkinData) ? checkinData : []}
          streakData={{
            current: stats?.daysRead || 0,
            last_date: null,
          }}
        />
      </View>


      {/* Reading List Section - Below Calendar */}
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
                  <Pressable 
                    style={styles.readingItem}
                    onPress={() => toggleExpanded(index)}
                  >
                    <View style={styles.readingItemLeft}>
                      <Text style={styles.readingItemDate}>
                        {format(new Date(session.date), 'dd MMM', { locale: id })}
                      </Text>
                      <Text style={styles.readingItemDay}>
                        {format(new Date(session.date), 'EEEE', { locale: id })}
                      </Text>
                    </View>
                    <View style={styles.readingItemRight}>
                      <Text style={styles.readingItemAyat}>
                        {session.ayat_count} ayat
                      </Text>
                      <Text style={styles.readingItemSessions}>
                        {session.session_count} sesi
                      </Text>
                    </View>
                    <View style={styles.readingItemArrow}>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
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
                            Sesi {sessionIndex + 1}: QS. {getSurahName(sessionDetail.surah_number)} {sessionDetail.ayat_start}-{sessionDetail.ayat_end} ({formatSessionTime(sessionDetail.session_time)} WIB)
                          </Text>
                          {sessionDetail.notes && (
                            <Text style={styles.sessionNotes}>
                              Catatan: {sessionDetail.notes}
                            </Text>
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
              <Text style={styles.emptyReadingListText}>
                Belum ada data bacaan
              </Text>
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
    padding: 24,
    paddingTop: 16,
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
});
