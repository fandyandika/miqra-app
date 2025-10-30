import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBookmark } from '@/services/quran/bookmarkService';
import { getLastReadHistory, deleteLastReadHistory } from '@/services/quran/lastReadHistory';
import { deleteReadingSession } from '@/services/reading';
import { colors } from '@/theme/colors';
import { loadSurahMetadata } from '@/services/quran/quranData';

export default function LastReadScreen() {
  const navigation = useNavigation<any>();
  const [surahs, setSurahs] = React.useState<any[]>([]);
  const queryClient = useQueryClient();

  const { data: bookmark, isLoading: bookmarkLoading } = useQuery({
    queryKey: ['bookmark'],
    queryFn: getBookmark,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['last-read-history'],
    queryFn: () => getLastReadHistory(100),
  });

  React.useEffect(() => {
    (async () => {
      const meta = await loadSurahMetadata();
      setSurahs(meta);
    })();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSurahName = (surahNumber: number) => {
    return surahs.find((s) => s.number === surahNumber)?.name || `Surah ${surahNumber}`;
  };

  if (bookmarkLoading || historyLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Terakhir Baca</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Terakhir Baca</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Current Last Read */}
      {bookmark && (
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <Feather name="book-open" size={16} color="#8B5A2B" />
            <Text style={styles.currentTitle}>Terakhir Baca</Text>
          </View>
          <Pressable
            style={styles.currentItem}
            onPress={() =>
              navigation.navigate('Reader', {
                surahNumber: bookmark.surah,
                ayahNumber: bookmark.ayat,
              })
            }
          >
            <View style={styles.currentContent}>
              <Text style={styles.currentText}>
                QS. {getSurahName(bookmark.surah)} {bookmark.surah}: Ayat {bookmark.ayat} (Juz:{' '}
                {bookmark.juz || '?'})
              </Text>
              <Text style={styles.currentDate}>
                {bookmark.timestamp ? formatDate(bookmark.timestamp) : 'Belum ada riwayat'}
              </Text>
            </View>
            <View style={styles.currentActions}>
              <Text style={styles.historyLink}>Mulai Baca</Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Reading History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Riwayat Tandai Bacaan ✍️</Text>
        {history && history.length > 0 ? (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.historyItem}
                onPress={() =>
                  navigation.navigate('Reader', {
                    surahNumber: item.surah_number,
                    ayahNumber: item.ayat_number,
                  })
                }
                onLongPress={() => {
                  const title = `Hapus riwayat?`;
                  const message = `QS. ${getSurahName(item.surah_number)} ${item.surah_number}:${item.ayat_number}`;
                  // dynamic import to avoid top-level Alert import churn
                  import('react-native').then(({ Alert }) => {
                    Alert.alert(title, message, [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteLastReadHistory(item.id);
                            queryClient.invalidateQueries({ queryKey: ['last-read-history'] });
                          } catch {}
                        },
                      },
                    ]);
                  });
                }}
              >
                <Text style={styles.historyText}>
                  QS. {getSurahName(item.surah_number)} {item.surah_number}: Ayat {item.ayat_number}
                  {item.juz_number ? ` (Juz: ${item.juz_number})` : ''}
                </Text>
                <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada riwayat</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  currentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  currentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  currentContent: {
    flex: 1,
  },
  currentText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  currentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  currentActions: {
    alignItems: 'flex-end',
  },
  historyLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
