import React, { useMemo } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TodayScreen from '../screens/home/TodayScreen';
import AppListScreen from '../screens/apps/AppListScreen';
import AppPickerScreen from '../screens/apps/AppPickerScreen';
import LimitEditorScreen from '../screens/apps/LimitEditorScreen';
import HistoryScreen from '../screens/records/HistoryScreen';
import InsightsScreen from '../screens/records/InsightsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Today' }} />
      <Tab.Screen name="Apps" component={AppListScreen} options={{ title: 'Limits' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
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
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
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