import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import HomeScreen from '@/screens/home/HomeScreen';
import ProgressScreen from '@/screens/stats/ProgressScreen';
import FamilyTabScreen from '@/screens/family/FamilyTabScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import PrimaryFab from '@/components/PrimaryFab';

const Tab = createBottomTabNavigator();

// Safe icon component to prevent undefined access
const SafeIcon = ({
  name,
  color,
  size,
}: {
  name: string;
  color?: string;
  size?: number;
}) => {
  try {
    const safeName = name && typeof name === 'string' ? name : 'help';
    const safeColor = color && typeof color === 'string' ? color : '#666666';
    const safeSize = size && typeof size === 'number' && size > 0 ? size : 24;

    return (
      <Ionicons name={safeName as any} color={safeColor} size={safeSize} />
    );
  } catch (error) {
    console.warn('[SafeIcon] Error rendering icon:', error);
    return <Ionicons name='help' color='#666666' size={24} />;
  }
};

export default function Tabs() {
  const nav = useNavigation<any>();
  const route = useRoute();

  // Hide FAB on LogReading screen to avoid interfering with input
  const hideFab = route.name === 'LogReading';

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const safeRouteName =
            route && typeof route === 'object' && route.name
              ? route.name
              : 'unknown';
          return {
            headerShown: false,
            tabBarActiveTintColor: '#00C896',
            tabBarStyle: {
              height: 70,
              paddingBottom: Platform.select({ ios: 20, android: 12 }),
              paddingTop: 8,
              paddingHorizontal: 20,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
              elevation: 8,
            },
            // Safe route handling
            tabBarTestID: `tab-${safeRouteName}`,
          };
        }}
      >
        <Tab.Screen
          name='Home'
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <SafeIcon name='home' color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name='Progress'
          component={ProgressScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <SafeIcon name='bar-chart' color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name='Family'
          component={FamilyTabScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <SafeIcon name='people' color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name='Profile'
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <SafeIcon name='person' color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* FAB overlay (always on top, hidden on LogReading) */}
      {!hideFab && <PrimaryFab onPress={() => nav.navigate('LogReading')} />}
    </View>
  );
}
