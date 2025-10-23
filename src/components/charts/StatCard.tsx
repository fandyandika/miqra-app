import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type StatCardProps = {
  value: string | number;
  label: string;
  color?: string;
  icon?: string;
};

export function StatCard({ value, label, color = colors.primary, icon }: StatCardProps) {
  // Safe value handling
  const safeValue = value ?? 0;
  const displayValue =
    typeof safeValue === 'number' ? safeValue.toLocaleString('id-ID') : safeValue || '0';

  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color }]}>{displayValue}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
