import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import clsx from 'clsx';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  minH?: number;
};

export default function Button({ title, onPress, disabled, loading, variant='primary', style, minH=48 }: Props) {
  const base = 'rounded-2xl px-4 py-3 active:opacity-80';
  const color = variant === 'primary'
    ? 'bg-primary'
    : variant === 'secondary'
      ? 'bg-forest'
      : 'bg-transparent border border-border';
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(base, color, (disabled || loading) ? 'opacity-60' : '')}
      style={{ minHeight: minH, ...style }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#1A1A1A' : '#FFFFFF'} />
      ) : (
        <Text className={clsx('text-center font-medium', variant === 'ghost' ? 'text-charcoal' : 'text-white')}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
