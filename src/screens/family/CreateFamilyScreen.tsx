import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import {
  useCreateFamily,
  useMyFamilies,
  useCreateInvite,
} from '@/hooks/useFamily';

export default function CreateFamilyScreen() {
  const [name, setName] = useState('');
  const create = useCreateFamily();
  const invite = useCreateInvite();

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      const fam = await create.mutateAsync(name);
      Alert.alert('Berhasil', `Keluarga "${fam.name}" berhasil dibuat!`);
      // Navigate back atau refresh data
    } catch (error: any) {
      console.error('Create family error:', error);
      const errorMessage =
        error?.message || error?.toString() || 'Unknown error';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View className='flex-1 bg-background px-5 pt-14'>
      <Text className='text-2xl font-semibold text-charcoal'>
        Buat Keluarga
      </Text>
      <TextInput
        className='mt-4 bg-surface rounded-xl px-4 py-3 border border-border'
        placeholder='Nama keluarga'
        value={name}
        onChangeText={setName}
      />
      <Pressable
        onPress={handleCreate}
        disabled={create.isPending}
        className={`rounded-xl px-4 py-3 mt-4 ${create.isPending ? 'bg-gray-400' : 'bg-primary'}`}
      >
        <Text className='text-white text-center font-medium'>
          {create.isPending ? 'Membuat...' : 'Buat'}
        </Text>
      </Pressable>
    </View>
  );
}
