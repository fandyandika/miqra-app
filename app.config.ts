import 'dotenv/config';

export default {
  expo: {
    name: 'Miqra',
    slug: 'miqra',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    icon: './assets/icons/icon.png',
    favicon: './assets/icons/favicon.png',
    splash: {
      image: './assets/splash/logo.png',
      backgroundColor: '#10b981',
      resizeMode: 'contain',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.miqra.miqra',
      icon: './assets/icons/icon.png',
    },
    android: {
      package: 'com.miqra.miqra',
      adaptiveIcon: {
        foregroundImage: './assets/icons/adaptive-icon.png',
        backgroundColor: '#10b981',
      },
    },
    plugins: [
      'expo-notifications',
      'expo-router',
      // Fonts will be added later when assets are ready.
      // ['expo-font', { fonts: ['./assets/fonts/Amiri-Regular.ttf', './assets/fonts/PlusJakartaSans-Regular.ttf'] }]
    ],
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
      SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      SUPABASE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    },
  },
};
