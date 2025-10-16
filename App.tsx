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
import './src/config/sentry';
import HomeScreen from './src/screens/home/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initLocal();
    posthog?.capture(EVENTS.APP_OPEN);
    console.log('[App] Initialized');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAFAFA' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
