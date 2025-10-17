import React from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFamilyMembers, useCreateInvite } from '@/hooks/useFamily';

export default function FamilyDashboardScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const familyId = route?.params?.familyId as string | undefined;
  const membersQ = useFamilyMembers(familyId ?? null);
  const invite = useCreateInvite();

  const handleInvite = async () => {
    if (!familyId) {
      Alert.alert('Error', 'Family ID tidak ditemukan');
      return;
    }
    
    try {
      console.log('[FamilyDashboard] Creating invite for family:', familyId);
      const data = await invite.mutateAsync({ familyId });
      console.log('[FamilyDashboard] Invite created:', data);
      
      if (data?.code) {
        Alert.alert(
          'Kode Undangan', 
          `Kode: ${data.code}\nBerlaku sampai: ${new Date(data.expires_at).toLocaleString('id-ID')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[FamilyDashboard] Create invite error:', error);
      Alert.alert('Error', error.message || 'Gagal membuat kode undangan');
    }
  };

  if (!familyId) {
    return (
      <View className="flex-1 bg-background px-5 pt-14">
        <Text className="text-2xl font-semibold text-charcoal">Dashboard Keluarga</Text>
        <View className="mt-4 p-4 bg-red-100 rounded-xl">
          <Text className="text-red-800">Error: Family ID tidak ditemukan</Text>
          <Pressable onPress={() => nav.goBack()} className="bg-red-600 rounded-lg px-3 py-2 mt-2 self-start">
            <Text className="text-white text-sm font-medium">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-semibold text-charcoal">Dashboard Keluarga</Text>
        <Pressable onPress={() => nav.goBack()} className="bg-gray-200 rounded-lg px-3 py-2">
          <Text className="text-gray-700 text-sm font-medium">Kembali</Text>
        </Pressable>
      </View>

      <Pressable 
        onPress={handleInvite} 
        disabled={invite.isPending}
        className="bg-forest rounded-xl px-4 py-3 mt-4 active:opacity-80"
        style={{ minHeight: 48 }}
      >
        {invite.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-center font-medium">Buat Kode Undangan</Text>
        )}
      </Pressable>

      <Text className="mt-6 text-charcoal font-medium">Anggota Keluarga:</Text>
      
      {membersQ.isLoading ? (
        <View className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
          <ActivityIndicator color="#00C896" size="large" />
          <Text className="text-gray-600 text-center mt-3 font-medium">Memuat anggota keluarga...</Text>
        </View>
      ) : membersQ.error ? (
        <View className="mt-4 p-6 bg-red-50 rounded-xl border border-red-200">
          <Text className="text-red-800 text-center font-medium">❌ Error memuat anggota</Text>
          <Text className="text-red-600 text-center mt-2 text-sm">{membersQ.error.message}</Text>
          <Pressable 
            onPress={() => membersQ.refetch()} 
            className="bg-red-600 rounded-lg px-4 py-2 mt-3 self-center"
          >
            <Text className="text-white text-sm font-medium">Coba Lagi</Text>
          </Pressable>
        </View>
      ) : membersQ.data?.length > 0 ? (
        <View className="mt-4">
          <FlatList
            data={membersQ.data}
            keyExtractor={(item:any) => item.user_id}
            renderItem={({ item }) => {
              const displayName = item.profiles?.display_name || `User ${item.user_id.slice(0,6)}`;
              const initial = displayName.charAt(0).toUpperCase();
              
              return (
                <View className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-4 mb-3 border border-border shadow-sm">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold text-lg">{initial}</Text>
                    </View>
                    <View>
                      <Text className="text-charcoal font-medium text-base">{displayName}</Text>
                      <Text className="text-text-secondary text-sm">
                        Bergabung {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${item.role === 'owner' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-medium ${item.role === 'owner' ? 'text-yellow-800' : 'text-green-800'}`}>
                      {item.role === 'owner' ? '👑 Owner' : '👤 Member'}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      ) : (
        <View className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <Text className="text-4xl text-center mb-3">👥</Text>
          <Text className="text-charcoal text-center font-medium text-lg mb-2">Belum Ada Anggota Lain</Text>
          <Text className="text-text-secondary text-center text-sm mb-4">
            Bagikan kode undangan untuk mengundang keluarga dan teman bergabung!
          </Text>
          <View className="bg-white rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-800 text-center text-sm font-medium">
              💡 Tips: Klik "Buat Kode Undangan" di atas untuk mengundang orang lain
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
