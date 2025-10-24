import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface HasanatCardProps {
  totalHasanat: number;
  totalLetters: number;
  streakDays: number;
  dailyAverage: number;
  isLoading?: boolean;
}

export function HasanatCard({
  totalHasanat,
  totalLetters,
  streakDays,
  dailyAverage,
  isLoading = false,
}: HasanatCardProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat data hasanat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="star" size={24} color={colors.primary} />
        <Text style={styles.title}>Hasanat</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalHasanat.toLocaleString('id-ID')}</Text>
          <Text style={styles.statLabel}>Total Hasanat</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalLetters.toLocaleString('id-ID')}</Text>
          <Text style={styles.statLabel}>Huruf Dibaca</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streakDays}</Text>
          <Text style={styles.statLabel}>Hari Berturut</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dailyAverage}</Text>
          <Text style={styles.statLabel}>Rata-rata/Hari</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>💫 Setiap huruf yang dibaca = 10 hasanat</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
