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
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import { ToastProvider } from './src/components/Toast';


function AppShell() {
  const { colors, isDark } = useTheme();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      await initDatabase();

      const onboarded = await getFlag('onboarded');
      setNeedsOnboarding(!onboarded);

      const seen = await getFlag('firstRunDone');
      await runSync(!seen);
      if (!seen) await setFlag('firstRunDone', true);

      setReady(true);
    };

    boot().catch(e => setError(String(e)));
  }, []);

  const finishOnboarding = async () => {
    await setFlag('onboarded', true);
    setNeedsOnboarding(false);
  };

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
      {needsOnboarding ? (
         <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
          <OnboardingScreen onDone={finishOnboarding} />
        </SafeAreaView>
      ) : (
        <Navigation />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
} 

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
