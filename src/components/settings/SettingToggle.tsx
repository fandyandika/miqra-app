import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type SettingToggleProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingToggle({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: SettingToggleProps) {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${label}. ${description ?? ''}`}
    >
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : '#F3F4F6'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  textContainer: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  description: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});
