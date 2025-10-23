import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SURAH_META } from '@/data/quran_meta';
import { colors } from '@/theme/colors';

// Safe date validation function
const isValidDate = (date: any): boolean => {
  return date && !isNaN(new Date(date).getTime());
};

type Session = {
  id: string;
  surah_number: number;
  ayat_start: number;
  ayat_end: number;
  ayat_count: number;
  session_time: string;
  notes?: string;
};

type GroupedSessions = {
  date: string;
  sessions: Session[];
  totalAyat: number;
};

type OptimizedReadingListProps = {
  groupedSessions: GroupedSessions[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
};

const ITEMS_PER_PAGE = 20;

export function OptimizedReadingList({
  groupedSessions,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: OptimizedReadingListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Memoize paginated data
  const paginatedData = useMemo(() => {
    return groupedSessions.slice(0, displayCount);
  }, [groupedSessions, displayCount]);

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
      onLoadMore?.();
    }
  };

  const renderSession = ({ item: session }: { item: Session }) => {
    const surahMeta = SURAH_META[session.surah_number - 1];

    return (
      <View style={styles.sessionItem}>
        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <Text style={styles.surahName}>
              {session.surah_number}. {surahMeta?.name || '—'}
            </Text>
            <Text style={styles.ayatCount}>{session.ayat_count} ayat</Text>
          </View>

          <Text style={styles.ayatRange}>
            Ayat {session.ayat_start}-{session.ayat_end}
          </Text>

          <Text style={styles.sessionTime}>
            {isValidDate(session.session_time)
              ? format(new Date(session.session_time), 'HH:mm', { locale: id })
              : '--:--'}
          </Text>

          {session.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              "{session.notes}"
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore && !isLoading) return null;

    return (
      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Pressable style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Muat Lebih Banyak</Text>
          </Pressable>
        )}
      </View>
    );
  };

  if (groupedSessions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Belum ada catatan bacaan bulan ini.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {paginatedData.map(group => {
        const isExpanded = expandedDates.has(group.date);
        const sessionCount = group.sessions.length;

        return (
          <View key={group.date} style={styles.dateGroup}>
            <Pressable
              style={styles.dateHeader}
              onPress={() => toggleDateExpansion(group.date)}
              accessibilityRole='button'
              accessibilityLabel={`${isValidDate(group.date) ? format(new Date(group.date), 'EEEE, d MMMM yyyy', { locale: id }) : 'Tanggal tidak valid'} - ${sessionCount} sesi, ${group.totalAyat} ayat`}
            >
              <View style={styles.dateHeaderContent}>
                <Text style={styles.dateText}>
                  {isValidDate(group.date)
                    ? format(new Date(group.date), 'EEEE, d MMMM yyyy', {
                        locale: id,
                      })
                    : 'Tanggal tidak valid'}
                </Text>
                <Text style={styles.dateTotal}>
                  {sessionCount} sesi • {group.totalAyat} ayat
                </Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.sessionsContainer}>
                {group.sessions.map(session => (
                  <View key={session.id}>
                    {renderSession({ item: session })}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      {renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  dateGroup: {
    marginBottom: 12,
  },
  dateHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateHeaderContent: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  dateStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTotal: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 12,
  },
  sessionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  expandIcon: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  sessionsContainer: {
    marginTop: 8,
    paddingLeft: 16,
  },
  sessionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  ayatCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  ayatRange: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
