import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SettingsScreen from '../screens/settings/SettingsScreen';
import TodayScreen from '../screens/home/TodayScreen';
import AppListScreen from '../screens/apps/AppListScreen';
import AppPickerScreen from '../screens/apps/AppPickerScreen';
import LimitEditorScreen from '../screens/apps/LimitEditorScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#9C9A92',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#EFEEE9' },
      }}>
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Ngayon' }} />
      <Tab.Screen name="Apps" component={AppListScreen} options={{ title: 'Limits' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FAFAF8' },
          headerTintColor: '#2C2C2A',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#FAFAF8' },
        }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AppPicker"
          component={AppPickerScreen}
          options={{ title: 'Pumili ng app' }}
        />
        <Stack.Screen
          name="LimitEditor"
          component={LimitEditorScreen}
          options={{ title: 'I-set ang limit' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}