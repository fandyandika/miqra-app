import 'react-native-reanimated';
import './global.css';
import 'react-native-css-interop/jsx-runtime';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { initLocal } from './src/lib/sqlite';
import { posthog, EVENTS } from './src/config/posthog';
import { useSyncManager } from './src/hooks/useSyncManager';
import { useAuthSession } from './src/hooks/useAuth';
import { useReadingSync } from './src/hooks/useReadingSync';
import { useCheckinSync } from './src/hooks/useCheckinSync';
import './src/config/sentry';
import CustomSplashScreen from './src/screens/splash/SplashScreen';
import BottomTabs from '@/navigation/BottomTabs';
import CatatBacaanScreen from '@/screens/catat-bacaan/CatatBacaanScreen';
import CreateFamilyScreen from '@/screens/family/CreateFamilyScreen';
import JoinFamilyScreen from '@/screens/family/JoinFamilyScreen';
import FamilyDashboardScreen from '@/screens/family/FamilyDashboardScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import TreeFullScreen from '@/screens/home/TreeFullScreen';
import LogReadingScreen from '@/features/reading/LogReadingScreen';
import KhatamProgressScreen from '@/features/reading/KhatamProgressScreen';
import ReadingHistoryScreen from '@/features/reading/ReadingHistoryScreen';
import ProfileScreen from '@/features/profile/ProfileScreen';
import SettingsScreen from '@/features/profile/SettingsScreen';
import ReminderSettingsScreen from '@/features/settings/ReminderSettingsScreen';
import StatsScreen from '@/features/stats/StatsScreen';
import HasanatScreen from '@/screens/hasanat/HasanatScreen';
import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['miqra://'],
  config: {
    screens: {
      JoinFamily: 'join/:code',
    },
  },
};

function AppContent() {
  useSyncManager();
  useReadingSync(); // Add real-time sync for reading data
  useCheckinSync(); // Add real-time sync for checkins and streak
  const { session, loading } = useAuthSession();

  console.log('[App] Auth state:', { session: !!session, loading });

  if (loading) {
    console.log('[App] Loading authentication state...');
    return null; // or a small splash
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFAFA' },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="BottomTabs" component={BottomTabs} />
            <Stack.Screen name="CatatBacaan" component={CatatBacaanScreen} />
            <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} />
            <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
            <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} />
            <Stack.Screen
              name="LogReading"
              component={LogReadingScreen}
              options={{ title: 'Catat Bacaan' }}
            />
            <Stack.Screen
              name="ReadingHistory"
              component={ReadingHistoryScreen}
              options={{ title: 'Riwayat Bacaan', headerShown: true }}
            />
            <Stack.Screen
              name="KhatamProgress"
              component={KhatamProgressScreen}
              options={{ title: 'Progres Khatam', headerShown: true }}
            />
            <Stack.Screen
              name="TreeFullScreen"
              component={TreeFullScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profil', headerShown: true }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Pengaturan', headerShown: true }}
            />
            <Stack.Screen
              name="ReminderSettings"
              component={ReminderSettingsScreen}
              options={{ title: 'Pengaturan Pengingat', headerShown: true }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{
                title: 'Statistik Bacaan',
                headerShown: true,
                presentation: 'modal',
                headerStyle: {
                  backgroundColor: '#FFF8F0',
                },
                headerTitleStyle: {
                  fontWeight: '700',
                },
              }}
            />
            <Stack.Screen
              name="Hasanat"
              component={HasanatScreen}
              options={{
                title: 'Hasanat',
                headerShown: true,
                presentation: 'modal',
                headerStyle: {
                  backgroundColor: '#F0F9FF',
                },
                headerTitleStyle: {
                  fontWeight: '700',
                },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Me Quran': require('./assets/fonts/me_quran-Regular.ttf'),
    'AmiriQuran-Regular': require('./assets/fonts/AmiriQuran-Regular.ttf'),
    'LPMQ-Isep-Misbah': require('./assets/fonts/LPMQ-Isep-Misbah.ttf'),
    PlusJakartaSans: require('./assets/fonts/PlusJakartaSans-VariableFont_wght.ttf'),
    UthmanicHafs: require('./assets/fonts/UthmanicHafs_V22.ttf'),
  });

  // Debug: Log font loading status
  useEffect(() => {
    if (fontsLoaded) {
      console.log('[App] Fonts loaded:', { fontsLoaded });
      console.log('[App] UthmanicHafs font should be available');
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize app data
        await initLocal();
        posthog?.capture(EVENTS.APP_OPEN);
        console.log('[App] Initialized');

        // Mark app as ready
        setIsAppReady(true);
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setIsAppReady(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Ensure native splash is kept until we're ready to show UI
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  // Wait for fonts to load
  if (!fontsLoaded) {
    return null;
  }

  const handleSplashComplete = () => {
    setIsSplashComplete(true);
  };

  // Show custom splash while app is initializing or for branding
  if (!isAppReady || !isSplashComplete) {
    return <CustomSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toast />
    </QueryClientProvider>
  );
}
