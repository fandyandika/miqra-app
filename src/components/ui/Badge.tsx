import React from 'react';
import { View, Text } from 'react-native';

export default function Badge({
  text,
  tone = 'accent',
}: {
  text: string;
  tone?: 'accent' | 'success' | 'error';
}) {
  const map: any = {
    accent: 'bg-accent/20 text-accent',
    success: 'bg-success/20 text-success',
    error: 'bg-error/20 text-error',
  };
  return (
    <View className={`px-3 py-1 rounded-full ${map[tone] || map.accent}`}>
      <Text className='text-xs font-medium'>{text}</Text>
    </View>
  );
}
