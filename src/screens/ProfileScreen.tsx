import React from 'react';
import { View, Text } from 'react-native';
import Header from '@/components/ui/Header';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Header title="Profil" subtitle="Nama, zona waktu, akun" />
      <Text className="text-text-secondary">Coming soon: edit nama, reminder time, logout.</Text>
    </View>
  );
}
