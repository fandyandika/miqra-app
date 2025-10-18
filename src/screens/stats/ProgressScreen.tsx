import React from 'react';
import { View, Text } from 'react-native';
import Header from '@/components/ui/Header';

export default function ProgressScreen() {
  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Header title="Progres" subtitle="Ringkasan bacaan & streak" />
      <Text className="text-text-secondary">Coming soon: kalender 30 hari, total ayat, longest streak.</Text>
    </View>
  );
}
