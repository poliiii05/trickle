import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createMMKV } from 'react-native-mmkv';

import { initDatabase } from './src/db/schema';
import Navigation from './src/navigation';
import { runSync } from './src/services/syncService';

const storage = createMMKV();

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }

        await initDatabase();

        const seen = storage.getBoolean('firstRunDone');

        await runSync(!seen);

        if (!seen) {
          storage.set('firstRunDone', true);
        }

        setReady(true);
      } catch (e) {
        setError(String(e));
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Database error: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
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

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  errorText: {
    color: '#A32D2D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FAFAF8',
  },
});