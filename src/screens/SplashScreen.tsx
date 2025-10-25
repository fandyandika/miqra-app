import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

const MIN_SHOW_MS = 2000;

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function CustomSplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Keep the native splash screen visible
    SplashScreen.preventAutoHideAsync();

    // Start the animation sequence
    const startAnimation = () => {
      const startedAt = Date.now();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Ensure splash is visible for at least MIN_SHOW_MS total
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
        setTimeout(() => {
          // Animation completed, hide native splash and transition
          SplashScreen.hideAsync().then(() => {
            onAnimationComplete();
          });
        }, remaining);
      });
    };

    // Small delay to ensure smooth transition from native splash
    const timer = setTimeout(startAnimation, 100);
    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/splash/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00c896',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fallbackLogoText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
