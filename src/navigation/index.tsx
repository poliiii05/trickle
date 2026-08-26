import React, { useMemo } from 'react';
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
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Apps"
        component={AppListScreen}
        options={{
          title: 'Limits',
          tabBarIcon: ({ color, size }) => <Hourglass color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size - 2} />,
        }}
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