import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/db/schema';
import { getFlag, setFlag } from './src/db/settingsRepo';
import { runSync } from './src/services/syncService';
import Navigation from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';

function AppShell() {
  const { colors, isDark } = useTheme();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      await initDatabase();

      const seen = await getFlag('firstRunDone');
      await runSync(!seen);
      if (!seen) await setFlag('firstRunDone', true);

      setReady(true);
    };

    boot().catch(e => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger }}>Startup error: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});