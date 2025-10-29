import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyFamilies } from '@/hooks/useFamily';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function FamilyTabScreen() {
  const nav = useNavigation<any>();
  const familiesQ = useMyFamilies();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    console.log('🧹 Clearing families cache in FamilyTab...');
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
  }, [queryClient]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear React Query cache for families
    queryClient.invalidateQueries({ queryKey: ['families', 'mine'] });
    setRefreshing(false);
  };

  if (familiesQ.isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">Memuat...</Text>
      </View>
    );
  }

  if (!familiesQ.data || familiesQ.data.length === 0) {
    console.log('[FamilyTab] No families data:', familiesQ.data);
    return (
      <View className="flex-1 bg-background px-5 pt-20 pb-4">
        <Header title="Circle" subtitle="Komunitas bacaanmu" />
        <View className="items-center justify-center flex-1 -mt-20">
          <Text className="text-6xl mb-4">👨‍👩‍👧‍👦</Text>
          <Text className="text-lg text-charcoal font-medium mb-2">Belum Ada Circle</Text>
          <Text className="text-text-secondary text-center mb-6">
            Buat keluarga baru atau gabung dengan kode undangan
          </Text>
          <Button title="Buat Circle" onPress={() => nav.navigate('CreateFamily')} />
          <Button
            title="Gabung Circle"
            onPress={() => nav.navigate('JoinFamily')}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    );
  }

  console.log('[FamilyTab] Families data:', familiesQ.data);

  return (
    <View className="flex-1 bg-background px-5 pt-20 pb-4">
      <Header title="Circle" subtitle="Komunitasku" />
      <FlatList
        data={familiesQ.data}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('FamilyDashboard', { familyId: item.id })}>
            <Card style={{ marginBottom: 12 }}>
              <Text className="text-lg font-medium text-charcoal">{item.name}</Text>
              <Text className="text-text-secondary text-xs mt-1">
                {item.role === 'owner' ? '👑 Owner' : '👤 Member'}
              </Text>
            </Card>
          </Pressable>
        )}
      />
      <View className="flex-row gap-2 pb-4">
        <Button
          title="Buat Circle Baru"
          variant="ghost"
          onPress={() => nav.navigate('CreateFamily')}
          style={{ flex: 1 }}
        />
        <Button title="Gabung" onPress={() => nav.navigate('JoinFamily')} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
