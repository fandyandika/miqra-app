import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type CompactStatsCardProps = {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
};

export function CompactStatsCard({
  value,
  label,
  icon,
  color = colors.primary,
}: CompactStatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
