import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, useColorScheme, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme/colors';
import FabCatat from '@/components/FabCatat';

// Import screens
import HomeScreen from '@/screens/HomeScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import FamilyScreen from '@/screens/FamilyScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import CatatBacaanScreen from '@/screens/CatatBacaanScreen';

const Tab = createBottomTabNavigator();

type Palette = {
  barBg: string;
  barShadow: string;
  text: string;
  neutral: string;
  primary: string;
  primarySoft: string;
  translucentBg: string;
  blurTint: 'light' | 'dark' | 'default';
};

function usePalette(): Palette {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    barBg: isDark ? colors.dark.barBg : colors.barBg,
    barShadow: colors.barShadow,
    text: isDark ? colors.dark.text : (colors as any).text?.primary || '#1A1A1A',
    neutral: isDark ? colors.dark.neutral : colors.neutral,
    primary: colors.primary,
    primarySoft: colors.primarySoft,
    translucentBg: isDark ? 'rgba(14,15,16,0.92)' : 'rgba(255,255,255,0.92)',
    blurTint: isDark ? 'dark' : 'light',
  };
}

// Tab item component
type TabItemProps = {
  icon: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  badgeCount?: number;
  palette: Palette;
};

function TabItem({ icon, label, isActive, onPress, onLongPress, badgeCount, palette }: TabItemProps) {
  const activeAnim = useRef(new Animated.Value(isActive ? -2 : -1)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [isActive]);

  const iconScale = activeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const labelOpacity = activeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  // Nudge icons slightly downward; keep labels fixed
  const iconNudgeY = Platform.OS === 'android' ? -3 : -3;
  // Nudge labels upward slightly (home/progress/family/profile)
  const labelNudgeY = Platform.OS === 'android' ? -2 : -1;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 0,
        minHeight: 48,
        minWidth: 48,
        height: '100%',
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Icon + badge group (translated) */}
        <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', transform: [{ translateY: iconNudgeY }] }}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <MaterialCommunityIcons
              name={icon as any}
              size={26}
              color={isActive ? palette.primary : palette.neutral}
            />
          </Animated.View>

          {typeof badgeCount === 'number' && badgeCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -10,
                backgroundColor: '#FF4D4F',
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.barBg,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', includeFontPadding: false }} numberOfLines={1}>
                {badgeCount > 99 ? '99+' : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>

        {/* Label (not translated) */}
        <Animated.Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: isActive ? palette.primary : palette.neutral,
            marginTop: 2,
            includeFontPadding: false,
            lineHeight: 14,
            opacity: labelOpacity,
            transform: [{ translateY: labelNudgeY }],
          }}
        >
          {label}
        </Animated.Text>

        {isActive && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: -8,
              width: 18,
              height: 3,
              backgroundColor: palette.primary,
              borderRadius: 2,
              opacity: activeAnim,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

// Custom tab bar component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const palette = usePalette();

  const hideFab = route.name === 'CatatBacaan';

  // Normalize bottom inset: some Android devices report large insets in Expo Go
  const bottomInset = Platform.OS === 'android' ? Math.min(insets.bottom, 6) : insets.bottom;

  // Slightly more compact height and padding to keep content visually centered
  const tabBarHeight = 68 + bottomInset; // slightly taller
  const FAB_SIZE = 58;
  const FAB_MARGIN_TOP = -(FAB_SIZE / 2) - (Platform.OS === 'android' ? 17 : 13); // raise a bit more so it clears the label

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios' ? { tint: palette.blurTint, intensity: 28 } : {};

  return (
    <View
      style={{
        backgroundColor: Platform.OS === 'android' ? palette.translucentBg : 'transparent',
        borderTopWidth: 1,
        borderTopColor: palette.barShadow,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 12,
        height: tabBarHeight,
        paddingBottom: bottomInset,
        paddingTop: 8,
      }}
    >
      <Container
        {...(containerProps as any)}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 52, // match taller bar
            position: 'relative',
          }}
        >
          {/* Left 2 tabs */}
          <View style={{ flexDirection: 'row', flex: 1, height: '100%' }}>
            {state.routes.slice(0, 2).map((r: any, i: number) => {
              const { options } = descriptors[r.key];
              const label = options.tabBarLabel || options.title || r.name;
              const icon = options.tabBarIcon || 'home-variant';
              const isFocused = state.index === i;
              const badgeCount = typeof options.tabBarBadge === 'number' ? options.tabBarBadge : undefined;

              const onPress = () => {
                const evt = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
                if (!isFocused && !evt.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(r.name, r.params);
                }
              };
              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: r.key });
              };
              return (
                <TabItem key={r.key} icon={icon} label={label} isActive={isFocused} onPress={onPress} onLongPress={onLongPress} badgeCount={badgeCount} palette={palette} />
              );
            })}
          </View>

          {/* Center FAB area */}
          <View style={{ 
            width: 92, 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
          }}>
            {!hideFab && (
              <>
                <View style={{ marginTop: FAB_MARGIN_TOP }}>
                  <FabCatat onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); navigation.navigate('CatatBacaan'); }} />
                </View>
                <Text style={{ 
                  marginTop: 16, // slightly lower label for readability
                  fontSize: 12,
                  fontWeight: '600',
                  color: palette.neutral,
                  textAlign: 'center',
                  includeFontPadding: false,
                  lineHeight: 12,
                }}>
                  Catat Bacaan
                </Text>
              </>
            )}
          </View>

          {/* Right 2 tabs */}
          <View style={{ flexDirection: 'row', flex: 1, height: '100%' }}>
            {state.routes.slice(2, 4).map((r: any, i: number) => {
              const routeIndex = 2 + i;
              const { options } = descriptors[r.key];
              const label = options.tabBarLabel || options.title || r.name;
              const icon = options.tabBarIcon || 'home-variant';
              const isFocused = state.index === routeIndex;
              const badgeCount = typeof options.tabBarBadge === 'number' ? options.tabBarBadge : undefined;

              const onPress = () => {
                const evt = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
                if (!isFocused && !evt.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(r.name, r.params);
                }
              };
              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: r.key });
              };
              return (
                <TabItem key={r.key} icon={icon} label={label} isActive={isFocused} onPress={onPress} onLongPress={onLongPress} badgeCount={badgeCount} palette={palette} />
              );
            })}
          </View>
        </View>
      </Container>
    </View>
  );
}

export default function BottomTabs() {
  const navigation = useNavigation<any>();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: 'home-variant' as any,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: 'chart-bar' as any,
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
          tabBarIcon: 'account-group' as any,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: 'account-circle' as any,
        }}
      />
    </Tab.Navigator>
  );
}
