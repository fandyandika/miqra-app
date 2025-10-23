import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type SimpleProgressBarProps = {
  title: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
  showPercentage?: boolean;
};

export function SimpleProgressBar({
  title,
  current,
  target,
  unit = 'ayat',
  color = colors.primary,
  showPercentage = true,
}: SimpleProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = current >= target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>
          {current.toLocaleString('id-ID')} / {target.toLocaleString('id-ID')} {unit}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: isComplete ? colors.success : color,
              },
            ]}
          />
        </View>
        {showPercentage && <Text style={styles.percentage}>{Math.round(percentage)}%</Text>}
      </View>

      {isComplete && <Text style={styles.completeText}>🎉 Target tercapai!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
    marginTop: 8,
  },
});
