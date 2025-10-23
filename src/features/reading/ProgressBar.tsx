import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  percentage: number;
  totalRead: number;
  totalQuran: number;
  animated?: boolean;
};

export function ProgressBar({ percentage, totalRead, totalQuran, animated = true }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(anim, {
        toValue: percentage,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(percentage);
    }
  }, [percentage, animated]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ width: '100%' }}>
      <View style={s.bg}>
        <Animated.View style={[s.fill, { width }]} />
      </View>
      <View style={s.row}>
        <Text style={s.perc}>{percentage.toFixed(1)}%</Text>
        <Text style={s.count}>
          {totalRead.toLocaleString('id-ID')} / {totalQuran.toLocaleString('id-ID')} ayat
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perc: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  count: {
    fontSize: 13,
    color: colors.neutral,
  },
});
