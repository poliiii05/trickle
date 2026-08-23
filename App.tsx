import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/db/schema';
import Navigation from './src/navigation';
import { PermissionsAndroid, Platform } from 'react-native';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const askNotifications = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }
    };

    askNotifications()
      .then(() => initDatabase())
      .then(() => setReady(true))
      .catch(e => setError(String(e)));
  }, []);
  
  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch(e => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#A32D2D' }}>Database error: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator color="#1D9E75" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
     <StatusBar barStyle="dark-content" />
      <Navigation />
    </SafeAreaProvider>
  );
}