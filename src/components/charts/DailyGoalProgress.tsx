import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type DailyGoalProgressProps = {
  currentAyat: number;
  dailyGoal: number;
  daysInPeriod: number;
  periodLabel: string;
};

export function DailyGoalProgress({
  currentAyat,
  dailyGoal,
  daysInPeriod,
  periodLabel,
}: DailyGoalProgressProps) {
  const targetAyat = dailyGoal * daysInPeriod;
  const percentage = targetAyat > 0 ? Math.min((currentAyat / targetAyat) * 100, 100) : 0;
  const isComplete = currentAyat >= targetAyat;
  const remainingDays = Math.ceil((targetAyat - currentAyat) / dailyGoal);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Target Harian</Text>
        <Text style={styles.goalText}>
          {dailyGoal} ayat/hari × {daysInPeriod} hari
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: isComplete ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.percentage}>
          {Math.round(percentage)}%
        </Text>
      </View>
      
      <View style={styles.statsRow}>
        <Text style={styles.currentText}>
          {currentAyat.toLocaleString('id-ID')} ayat
        </Text>
        <Text style={styles.targetText}>
          Target: {targetAyat.toLocaleString('id-ID')} ayat
        </Text>
      </View>
      
      {!isComplete && remainingDays > 0 && (
        <Text style={styles.remainingText}>
          Sisa {remainingDays} hari untuk mencapai target
        </Text>
      )}
      
      {isComplete && (
        <Text style={styles.completeText}>🎉 Target tercapai!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  goalText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  targetText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  remainingText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
    textAlign: 'center',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
});
