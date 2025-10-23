import React from 'react';
import { View, Text } from 'react-native';

export default function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className='mb-2'>
      <Text className='text-2xl font-semibold text-charcoal'>{title}</Text>
      {!!subtitle && (
        <Text className='text-text-secondary mt-1'>{subtitle}</Text>
      )}
    </View>
  );
}
