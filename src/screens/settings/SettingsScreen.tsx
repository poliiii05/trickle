import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, AppState, Alert } from 'react-native';
import Tracking from '../../native/Tracking';
import Permissions from '../../native/Permissions';
import type { PermissionStatus } from '../../native/types';

export default function SettingsScreen() {
  const [monitoring, setMonitoring] = useState(true);
  const [a11yEnabled, setA11yEnabled] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [perms, setPerms] = useState<PermissionStatus | null>(null);
  const appState = useRef(AppState.currentState);

  const refresh = useCallback(async () => {
    setMonitoring(await Tracking.isMonitoringEnabled());
    setA11yEnabled(await Tracking.isAccessibilityEnabled());
    setServiceRunning(await Tracking.isServiceRunning());
    setPerms(await Permissions.getPermissionStatus());
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', next => {
      if (appState.current?.match(/inactive|background/) && next === 'active') {
        refresh();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refresh]);

  const onToggleMonitoring = async (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Stop blocking?',
        'Apps will no longer be blocked until you turn this back on.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              await Tracking.setMonitoringEnabled(false);
              setMonitoring(false);
            },
          },
        ],
      );
      return;
    }
    await Tracking.setMonitoringEnabled(true);
    setMonitoring(true);
  };

  const onClearLocks = () => {
    Alert.alert('Clear all locks?', 'Every app will return to its full allowance.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          await Tracking.clearAllLocks();
          Alert.alert('Done', 'All locks have been reset.');
        },
      },
    ]);
  };

  const healthy = a11yEnabled && serviceRunning && monitoring;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <View
        style={{
          backgroundColor: healthy ? '#E1F5EE' : '#FAECE7',
          padding: 16,
          borderRadius: 12,
        }}>
        <Text style={{ color: healthy ? '#0F6E56' : '#993C1D', fontWeight: '500' }}>
          {healthy ? 'Trickle is active' : 'Trickle is not active'}
        </Text>
        {!healthy && (
          <Text style={{ color: '#993C1D', marginTop: 6, lineHeight: 20 }}>
            {!a11yEnabled
              ? 'The accessibility service is turned off.'
              : !serviceRunning
              ? 'The service is not running — it may have been killed by battery optimization.'
              : 'Blocking is turned off.'}
          </Text>
        )}
      </View>

      <Row
        title="Blocking"
        subtitle="The master switch. Turn this off if you need emergency access."
        right={
          <Switch
            value={monitoring}
            onValueChange={onToggleMonitoring}
            trackColor={{ true: '#1D9E75' }}
          />
        }
      />

      <Text style={{ fontSize: 14, color: '#9C9A92', marginTop: 8 }}>Permissions</Text>

      <PermRow
        title="Accessibility service"
        ok={a11yEnabled}
        required
        onPress={() => Tracking.openAccessibilitySettings()}
      />
      <PermRow
        title="Usage access"
        ok={perms?.usageStats ?? false}
        required
        onPress={() => Permissions.openUsageAccessSettings()}
      />
      <PermRow
        title="Display over other apps"
        ok={perms?.overlay ?? false}
        onPress={() => Permissions.openOverlaySettings()}
      />
      <PermRow
        title="Ignore battery optimization"
        ok={perms?.batteryExempt ?? false}
        onPress={() => Permissions.openBatteryOptimizationSettings()}
      />

      <Text style={{ fontSize: 13, color: '#9C9A92', lineHeight: 20, marginTop: 8 }}>
        On Honor, Xiaomi, Oppo, Vivo, and Realme devices, also find "App launch" or
        "Autostart" in the app settings and set Trickle to manual with every toggle on.
        Otherwise the system will kill the service.
      </Text>

      <Pressable onPress={onClearLocks} style={{ padding: 12, marginTop: 16 }}>
        <Text style={{ color: '#A32D2D', textAlign: 'center' }}>Clear all locks</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ title, subtitle, right }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: '#2C2C2A' }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: '#6B6B66', marginTop: 4, lineHeight: 19 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

function PermRow({ title, ok, required, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: ok ? '#1D9E75' : required ? '#D85A30' : '#C9C7BF',
        }}
      />
      <Text style={{ flex: 1, fontSize: 16, color: '#2C2C2A' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: ok ? '#6B6B66' : '#1D9E75' }}>
        {ok ? 'Ok' : 'Set up'}
      </Text>
    </Pressable>
  );
}