import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface LeaderboardEntry {
  user_id?: string;
  name: string;
  total_hasanat: number;
  total_letters: number;
  streak_days: number;
  isCurrentUser?: boolean;
}

interface HasanatLeaderboardProps {
  personal: {
    total_hasanat: number;
    total_letters: number;
    streak_days: number;
    daily_average: number;
  };
  family: LeaderboardEntry[];
  isLoading?: boolean;
}

export function HasanatLeaderboard({
  personal,
  family,
  isLoading = false,
}: HasanatLeaderboardProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat leaderboard...</Text>
        </View>
      </View>
    );
  }

  const allEntries = [
    { ...personal, name: 'Anda', isCurrentUser: true },
    ...family.map((entry) => ({ ...entry, isCurrentUser: false })),
  ].sort((a, b) => b.total_hasanat - a.total_hasanat);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="trophy" size={24} color={colors.primary} />
        <Text style={styles.title}>Leaderboard Hasanat</Text>
      </View>

      <ScrollView style={styles.leaderboard} showsVerticalScrollIndicator={false}>
        {allEntries.map((entry, index) => (
          <View
            key={entry.user_id || entry.name}
            style={[
              styles.entry,
              entry.isCurrentUser && styles.currentUserEntry,
              index === 0 && styles.firstPlace,
            ]}
          >
            <View style={styles.rankContainer}>
              {index < 3 ? (
                <MaterialCommunityIcons
                  name={index === 0 ? 'trophy' : index === 1 ? 'medal' : 'medal-outline'}
                  size={20}
                  color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                />
              ) : (
                <Text style={styles.rankNumber}>{index + 1}</Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={[styles.userName, entry.isCurrentUser && styles.currentUserName]}>
                {entry.name}
                {entry.isCurrentUser && ' (Anda)'}
              </Text>
              <Text style={styles.userStats}>
                {entry.streak_days} hari berturut • {entry.total_letters.toLocaleString('id-ID')}{' '}
                huruf
              </Text>
            </View>

            <View style={styles.hasanatContainer}>
              <Text style={[styles.hasanatValue, entry.isCurrentUser && styles.currentUserHasanat]}>
                {entry.total_hasanat.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.hasanatLabel}>hasanat</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {family.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyText}>Belum ada data keluarga</Text>
          <Text style={styles.emptySubtext}>
            Bergabung dengan keluarga untuk melihat leaderboard
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    margin: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 8,
  },
  leaderboard: {
    maxHeight: 400,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currentUserEntry: {
    backgroundColor: colors.primary + '10',
  },
  firstPlace: {
    backgroundColor: '#FFD700' + '20',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  currentUserName: {
    color: colors.primary,
  },
  userStats: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  hasanatContainer: {
    alignItems: 'flex-end',
  },
  hasanatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  currentUserHasanat: {
    color: colors.primary,
  },
  hasanatLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
