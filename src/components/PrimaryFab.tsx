import React from 'react';
import { Pressable, View, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = { onPress: () => void };

export default function PrimaryFab({ onPress }: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Platform.select({ ios: 34, android: 26 }),
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <Pressable
        onPress={async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            // Haptics not available on this device/platform
            console.log('[PrimaryFab] Haptics not available:', error);
          }
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Catat bacaan Al-Qur'an"
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#10b981',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#10b981',
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          borderWidth: 3,
          borderColor: '#FFFFFF',
        }}
      >
        {/* Icon yang lebih aesthetic dan delighting */}
        <View
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>📖</Text>
        </View>
      </Pressable>

      {/* Label dengan font yang sama seperti tab lainnya */}
      <Text
        style={{
          color: '#10b981',
          fontSize: 12,
          fontWeight: '600',
          marginTop: 6,
          textAlign: 'center',
        }}
      >
        Catat Bacaan
      </Text>
    </View>
  );
}
