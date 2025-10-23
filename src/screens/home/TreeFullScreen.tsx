import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { TreeView } from '@/components/TreeView';
import { didBreakYesterday, getTreeStage } from '@/lib/streak';
import { colors } from '@/theme/colors';
import { getCurrentStreak } from '@/services/checkins';
import { getProfileTimezone } from '@/services/profile';

export default function TreeFullScreen() {
  const nav = useNavigation<any>();

  const { data: timezoneData } = useQuery({
    queryKey: ['profile', 'timezone'],
    queryFn: getProfileTimezone,
    staleTime: 300_000, // 5 minutes
  });
  const tz = timezoneData ?? 'Asia/Jakarta';

  const { data } = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 30_000,
  });

  const current = data?.current ?? 0;
  const last = data?.last_date ?? null;
  const broke = didBreakYesterday(last, tz);

  const stage = getTreeStage(current);
  const encouragement = broke
    ? 'Ayo kembali rutin hari ini agar pohonmu pulih.'
    : 'Teruskan kebiasaan baikmu — sedikit demi sedikit, insyaAllah konsisten.';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        justifyContent: 'center',
      }}
    >
      <Pressable
        onPress={() => nav.goBack()}
        style={{ position: 'absolute', top: 20, right: 16, padding: 8 }}
      >
        <Text style={{ fontSize: 16 }}>Tutup</Text>
      </Pressable>

      <TreeView currentStreakDays={current} brokeYesterday={broke} size={340} />

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Streak: {current} hari
        </Text>
        {stage === 'ancient' && (
          <Text
            style={{
              color: '#FFD700',
              fontWeight: 'bold',
              fontSize: 18,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            👑 LEGENDARY ACHIEVEMENT! 👑
          </Text>
        )}
        <Text style={{ color: colors.mutedText, marginTop: 6 }}>
          {encouragement}
        </Text>

        <Pressable
          onPress={() => {
            /* open bottom sheet if available; otherwise simple alert */
          }}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ textDecorationLine: 'underline' }}>
            Apa arti tahap pohon?
          </Text>
        </Pressable>
        <Text
          style={{ color: colors.mutedText, fontSize: 12, textAlign: 'center' }}
        >
          Tahapan: sprout (1–2), sapling (3–9), young (10–29), mature (30–99),
          {stage === 'ancient' ? (
            <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {' '}
              ancient (100+) 👑
            </Text>
          ) : (
            ' ancient (100+)'
          )}
        </Text>
      </View>
    </View>
  );
}
