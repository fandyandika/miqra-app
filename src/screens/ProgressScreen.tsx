import React from 'react';
import { View, Text } from 'react-native';
import Header from '@/components/ui/Header';

export default function ProgressScreen() {
  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Header title="Progress" subtitle="Statistik dan grafik bacaan" />
      <Text className="text-text-secondary">Coming soon: grafik progress, statistik harian, dan analisis bacaan.</Text>
    </View>
  );
}
