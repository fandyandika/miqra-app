import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface HasanatDisplayProps {
  hasanat: number;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function HasanatDisplay({ hasanat, size = 'medium', showIcon = true }: HasanatDisplayProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: 16,
          value: styles.smallValue,
          label: styles.smallLabel,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: 32,
          value: styles.largeValue,
          label: styles.largeLabel,
        };
      default: // medium
        return {
          container: styles.mediumContainer,
          icon: 24,
          value: styles.mediumValue,
          label: styles.mediumLabel,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {showIcon && (
        <MaterialCommunityIcons name="star" size={sizeStyles.icon} color={colors.primary} />
      )}
      <Text style={[styles.value, sizeStyles.value]}>{hasanat.toLocaleString('id-ID')}</Text>
      <Text style={[styles.label, sizeStyles.label]}>hasanat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  value: {
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 4,
  },
  smallValue: {
    fontSize: 12,
  },
  mediumValue: {
    fontSize: 16,
  },
  largeValue: {
    fontSize: 20,
  },
  label: {
    color: colors.text.secondary,
    marginLeft: 2,
  },
  smallLabel: {
    fontSize: 10,
  },
  mediumLabel: {
    fontSize: 12,
  },
  largeLabel: {
    fontSize: 14,
  },
});
