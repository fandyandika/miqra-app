import 'dotenv/config';

export default {
  expo: {
    name: 'Miqra',
    slug: 'miqra',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true, bundleIdentifier: 'com.miqra.app' },
    android: { package: 'com.miqra.app' },
    plugins: [
      'expo-notifications',
      // Fonts will be added later when assets are ready.
      // ['expo-font', { fonts: ['./assets/fonts/Amiri-Regular.ttf', './assets/fonts/PlusJakartaSans-Regular.ttf'] }]
    ],
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
      SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      SUPABASE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL
    }
  },
};
