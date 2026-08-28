import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Clock, Hourglass, BarChart3, Flame, Settings2 } from 'lucide-react-native';

import TodayScreen from '../screens/home/TodayScreen';
import AppListScreen from '../screens/apps/AppListScreen';
import AppPickerScreen from '../screens/apps/AppPickerScreen';
import LimitEditorScreen from '../screens/apps/LimitEditorScreen';
import HistoryScreen from '../screens/records/HistoryScreen';
import InsightsScreen from '../screens/records/InsightsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AppHeader from '../components/AppHeader';
import { useTheme, radius } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type IconProps = { color: string; size: number; focused: boolean };

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Wraps a tab icon in a pill that fills when the tab is active. */
function makeTabIcon(
  Icon: typeof Clock,
  activeBg: string,
) {
  return function TabIcon({ color, size, focused }: IconProps) {
    return (
      <View
        style={[
          styles.iconWrap,
          focused && { backgroundColor: activeBg },
        ]}>
        <Icon color={color} size={size - 3} />
      </View>
    );
  };
}

const renderHeader = () => <AppHeader />;

function Tabs() {
  const { colors } = useTheme();

  const icons = useMemo(
    () => ({
      today: makeTabIcon(Clock, colors.primarySoft),
      limits: makeTabIcon(Hourglass, colors.primarySoft),
      history: makeTabIcon(BarChart3, colors.primarySoft),
      insights: makeTabIcon(Flame, colors.primarySoft),
      settings: makeTabIcon(Settings2, colors.primarySoft),
    }),
    [colors.primarySoft],
  );

  return (
    <Tab.Navigator
      screenOptions={{
        header: renderHeader,
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: 'Today', tabBarIcon: icons.today }}
      />
      <Tab.Screen
        name="Apps"
        component={AppListScreen}
        options={{ title: 'Limits', tabBarIcon: icons.limits }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History', tabBarIcon: icons.history }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: 'Insights', tabBarIcon: icons.insights }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: icons.settings }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { colors, isDark } = useTheme();

  const navTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AppPicker"
          component={AppPickerScreen}
          options={{ title: 'Choose an app' }}
        />
        <Stack.Screen
          name="LimitEditor"
          component={LimitEditorScreen}
          options={{ title: 'Set limit' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}