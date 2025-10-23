import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyFamilies } from '@/hooks/useFamily';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/ui/Header';

export default function FamilyScreen() {
  const nav = useNavigation<any>();
  const familiesQ = useMyFamilies();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
  }, [queryClient]);

  const onRefresh = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
    setRefreshing(false);
  };

  return (
    <View className='flex-1 bg-background px-5 pt-14'>
      <Header title='Keluarga' subtitle='Keluargaku' />
      <FlatList
        data={familiesQ.data}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#00C896'
            colors={['#00C896']}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              nav.navigate('FamilyDashboard', { familyId: item.id })
            }
            className='bg-surface rounded-xl px-4 py-3 mb-2 border border-border'
          >
            <Text className='text-charcoal font-medium'>{item.name}</Text>
            <Text className='text-text-secondary text-sm mt-1'>
              {item.role}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className='mt-4 p-4 bg-gray-100 rounded-xl'>
            <Text className='text-gray-600 text-center'>
              Belum ada keluarga
            </Text>
          </View>
        }
      />
    </View>
  );
}
