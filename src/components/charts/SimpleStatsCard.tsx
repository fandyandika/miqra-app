import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type SimpleStatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
};

export function SimpleStatsCard({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  trend,
}: SimpleStatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'neutral':
        return '➡️';
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {trend && <Text style={styles.trendIcon}>{getTrendIcon()}</Text>}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
  icon: {
    fontSize: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trendIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
