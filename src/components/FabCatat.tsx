import React, { useRef } from 'react';
import { Pressable, Animated, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';

type Props = {
  onPress: () => void;
};

export default function FabCatat({ onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.log('[FabCatat] Haptics not available:', error);
    }
    onPress();
  };

  const SIZE = 58;
  const RADIUS = SIZE / 2;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Outer halo ring */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          right: -8,
          bottom: -8,
          borderRadius: RADIUS + 8,
          backgroundColor: colors.primary,
          opacity: 0.12,
        }}
      />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Catat bacaan Al-Qur'an"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: RADIUS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 10,
          backgroundColor: 'transparent',
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primarySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.6)', // subtle inner ring to separate from blur
          }}
        >
          <MaterialIcons 
            name="menu-book" 
            size={28} 
            color="#FFFFFF" 
          />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
