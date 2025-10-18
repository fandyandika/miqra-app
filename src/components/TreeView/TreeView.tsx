import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '@/theme/colors';
import { getTreeVisual, getTreeA11yLabel, TreeStage, TreeVariant } from '@/lib/streak';

type Props = {
  currentStreakDays: number;
  brokeYesterday: boolean;
  size?: number;          // default 260
  autoPlay?: boolean;     // default true
  loop?: boolean;         // default true
  enableTransition?: boolean; // default true (can disable in tests)
  testID?: string;
  onPress?: () => void;   // for opening fullscreen
};

const EMOJI_MAP: Record<TreeStage, string> = {
  sprout:  '🌱',
  sapling: '🌿',
  young:   '🌳',
  mature:  '🌲',
  ancient: '🌟🌳', // Golden tree for ancient stage
};

// Optionally map to images if available (Week-1 can leave undefined)
const IMG_MAP: Partial<Record<TreeStage, any>> = {
  // e.g. young: require('@/assets/img/tree_young.png'),
};

const LOTTIE_MAP: Partial<Record<TreeStage, Partial<Record<TreeVariant, any>>>> = {
  // Week-1: may be empty; keep structure for Week-2 drop-in
  // mature: { healthy: require('@/assets/lottie/tree_mature_healthy.json') }
};

export default function TreeView(props: Props) {
  const {
    currentStreakDays,
    brokeYesterday,
    size = 260,
    autoPlay = true,
    loop = true,
    enableTransition = true,
    testID,
    onPress,
  } = props;

  const visual = useMemo(() => getTreeVisual({ currentStreakDays, brokeYesterday }), [currentStreakDays, brokeYesterday]);
  const a11yLabel = useMemo(
    () => getTreeA11yLabel(visual.stage, visual.variant, currentStreakDays),
    [visual.stage, visual.variant, currentStreakDays]
  );

  // Choose best-available asset:
  const lottieSrc = LOTTIE_MAP[visual.stage]?.[visual.variant];
  const imageSrc  = IMG_MAP[visual.stage];
  const emoji     = EMOJI_MAP[visual.stage];

  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!enableTransition) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visual.stage, visual.variant, enableTransition]);

  const content = (() => {
    if (lottieSrc) {
      return (
        <LottieView
          source={lottieSrc}
          autoPlay={autoPlay}
          loop={loop}
          style={{ width: size, height: size }}
        />
      );
    }
    if (imageSrc) {
      return (
        <Image
          source={imageSrc}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      );
    }
    if (emoji) {
      return (
        <Text style={{ fontSize: Math.max(80, size * 0.45), textAlign: 'center' }}>
          {emoji}
        </Text>
      );
    }
    // Last resort circle
    return (
      <View style={{
        width: size, height: size, borderRadius: size/2,
        backgroundColor: colors.primary, opacity: 0.2
      }} />
    );
  })();

  const body = (
    <Animated.View
      accessibilityRole="image"
      accessible
      accessibilityLabel={a11yLabel}
      style={{ opacity: fadeAnim, alignItems: 'center', justifyContent: 'center' }}
    >
      {content}
      {/* Crown badge for ancient stage */}
      {visual.stage === 'ancient' && (
        <View style={{ 
          position: 'absolute', 
          top: -10, 
          right: -10,
          backgroundColor: '#FFD700',
          borderRadius: 20,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          <Text style={{ fontSize: 24 }}>👑</Text>
        </View>
      )}
    </Animated.View>
  );

  return onPress ? (
    <Pressable onPress={onPress} testID={testID} style={{ alignItems: 'center', justifyContent: 'center' }}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} style={{ alignItems: 'center', justifyContent: 'center' }}>
      {body}
    </View>
  );
}
