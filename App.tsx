import 'react-native-reanimated';
import './global.css';
import 'react-native-css-interop/jsx-runtime';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import BottomTabs from '@/navigation/BottomTabs';
import CatatBacaanScreen from '@/screens/CatatBacaanScreen';
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
import StatsScreen from '@/features/stats/StatsScreen';

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
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    initLocal();
    posthog?.capture(EVENTS.APP_OPEN);
    console.log('[App] Initialized');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
