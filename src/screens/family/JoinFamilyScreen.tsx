import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRedeemInvite } from '@/hooks/useFamily';

export default function JoinFamilyScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const redeem = useRedeemInvite();
  const [code, setCode] = useState('');

  useEffect(() => {
    const deepCode = route?.params?.code;
    if (deepCode) setCode(String(deepCode));
  }, [route?.params]);

  const handleJoin = async () => {
    if (!code || code.length < 6) return;
    try {
      const familyId = await redeem.mutateAsync(code);
      Alert.alert('Berhasil', 'Kamu bergabung ke keluarga');
      nav.navigate('FamilyDashboard', { familyId });
    } catch (e:any) {
      Alert.alert('Gagal', e.message || 'Tidak bisa bergabung');
    }
  };

  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Text className="text-2xl font-semibold text-charcoal">Gabung Keluarga</Text>
      <TextInput
        className="mt-4 bg-surface rounded-xl px-4 py-3 border border-border"
        placeholder="Masukkan 6-digit kode"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />
      <Pressable onPress={handleJoin} className="bg-primary rounded-xl px-4 py-3 mt-4">
        <Text className="text-white text-center font-medium">Gabung</Text>
      </Pressable>
    </View>
  );
}
