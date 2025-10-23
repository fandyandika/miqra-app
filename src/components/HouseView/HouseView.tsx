import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { calcHouseLight, getHouseA11yLabel, HouseLight } from '@/lib/familyLight';
import { colors } from '@/theme/colors';

type Props = {
  membersReadToday: number;
  totalMembers: number;
  familyStreakDays: number;
  size?: number;
  variant?: 'plain' | 'card'; // default plain
};

const EMOJI_MAP: Record<HouseLight, string> = {
  dark: '🏠',
  dim: '🏡',
  bright: '🌇',
  radiant: '🏠✨',
};

export default function HouseView(props: Props) {
  const { membersReadToday, totalMembers, familyStreakDays, size = 200, variant = 'plain' } = props;

  const state = useMemo(
    () =>
      calcHouseLight({
        membersReadToday: membersReadToday || 0,
        totalMembers: totalMembers || 0,
        familyStreakDays: familyStreakDays || 0,
      }),
    [membersReadToday, totalMembers, familyStreakDays]
  );
  const a11yLabel = useMemo(
    () => getHouseA11yLabel(state, membersReadToday || 0, totalMembers || 0),
    [state, membersReadToday, totalMembers]
  );

  // Optional future Lottie map placeholder
  const lottie = undefined;
  const emoji = EMOJI_MAP[state];

  const content = lottie ? (
    <LottieView source={lottie} autoPlay loop style={{ width: size, height: size }} />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.45, textAlign: 'center' }}>{emoji}</Text>
    </View>
  );

  const containerStyle =
    variant === 'card'
      ? {
          backgroundColor: '#FFF8F0',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        }
      : { alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
      style={containerStyle}
    >
      {content}
    </View>
  );
}
