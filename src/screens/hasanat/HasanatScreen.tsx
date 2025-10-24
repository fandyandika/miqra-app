import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/hooks/useAuth';
import { getHasanatStats, getHasanatLeaderboard } from '@/services/hasanat';
import { HasanatCard, HasanatLeaderboard, HasanatPreviewCard } from '@/components/hasanat';
import { colors } from '@/theme/colors';

export default function HasanatScreen() {
  const { session } = useAuthSession();
  const user = session?.user;

  // Get personal hasanat stats
  const { data: hasanatStats, isLoading: statsLoading } = useQuery({
    queryKey: ['hasanat', 'stats'],
    queryFn: getHasanatStats,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get family leaderboard (you can pass familyId if needed)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['hasanat', 'leaderboard'],
    queryFn: () => getHasanatLeaderboard(), // Pass familyId if available
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = statsLoading || leaderboardLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat data hasanat...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌟 Hasanat</Text>
        <Text style={styles.headerSubtitle}>Setiap huruf yang dibaca = 10 hasanat</Text>
      </View>

      {/* Hasanat Stats Card */}
      {hasanatStats && (
        <HasanatCard
          totalHasanat={hasanatStats.total_hasanat}
          totalLetters={hasanatStats.total_letters}
          streakDays={hasanatStats.streak_days}
          dailyAverage={hasanatStats.daily_average}
        />
      )}

      {/* Hasanat Preview Card */}
      <HasanatPreviewCard />

      {/* Leaderboard */}
      {leaderboardData && (
        <HasanatLeaderboard personal={leaderboardData.personal} family={leaderboardData.family} />
      )}

      {/* Motivational Section */}
      <View style={styles.motivationSection}>
        <Text style={styles.motivationTitle}>💫 Motivasi</Text>
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            "Barangsiapa yang membaca satu huruf dari Kitab Allah, maka baginya satu kebaikan, dan
            satu kebaikan itu akan dilipatgandakan menjadi sepuluh kebaikan."
          </Text>
          <Text style={styles.motivationSource}>— HR. Tirmidzi</Text>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips Meningkatkan Hasanat</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>Baca Al-Quran setiap hari, meskipun hanya 1 ayat</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>Pilih waktu yang konsisten untuk membaca</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>Mulai dengan surah pendek untuk membangun kebiasaan</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>4</Text>
            <Text style={styles.tipText}>Bergabung dengan keluarga untuk saling memotivasi</Text>
          </View>
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
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
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  motivationSection: {
    margin: 16,
    marginTop: 8,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  motivationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  motivationText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  motivationSource: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  tipsSection: {
    margin: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  tipsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});
