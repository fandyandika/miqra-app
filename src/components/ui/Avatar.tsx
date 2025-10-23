import React from 'react';
import { View, Text } from 'react-native';

export default function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initials =
    (name ?? '')
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((s) => s?.[0]?.toUpperCase() || '')
      .filter(Boolean)
      .join('') || 'U';
  return (
    <View
      className="bg-forest/15 rounded-full items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text className="text-forest font-semibold">{initials}</Text>
    </View>
  );
}
