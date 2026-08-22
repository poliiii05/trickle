import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, AppState, ActivityIndicator, RefreshControl,
} from 'react-native';
import Permissions from '../../native/Permissions';
import Apps from '../../native/Apps';
import type { UsageStat } from '../../native/types';
import { startOfToday, formatDuration } from '../../utils/time';
import PermissionGate from './PermissionGate';

export default function TodayScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  const load = useCallback(async () => {
    const granted = await Permissions.hasUsageStatsPermission();
    setHasPermission(granted);
    if (!granted) return;

    setLoading(true);
    try {
      const data = await Apps.getUsageStats(startOfToday(), Date.now());
      data.sort((a, b) => b.totalSeconds - a.totalSeconds);
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const sub = AppState.addEventListener('change', next => {
            if (appState.current?.match(/inactive|background/) && next === 'active') {
        load();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [load]);

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color="#1D9E75" />
      </View>
    );
  }

  if (!hasPermission) return <PermissionGate onRecheck={load} />;

  const total = stats.reduce((sum, s) => sum + s.totalSeconds, 0);

  return (
    <FlatList
      data={stats}
      keyExtractor={item => item.packageName}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor="#1D9E75" />
      }
      ListHeaderComponent={
        <View style={{ padding: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#9C9A92' }}>Screen time ngayong araw</Text>
          <Text style={{ fontSize: 40, fontWeight: '600', color: '#2C2C2A' }}>
            {formatDuration(total)}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B6B66', marginTop: 4 }}>
            {stats.length} apps ang nagamit
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#EFEEE9',
          }}>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 16, color: '#2C2C2A', marginRight: 12 }}>
            {item.appLabel}
          </Text>
          <Text style={{ fontSize: 15, color: '#6B6B66', fontVariant: ['tabular-nums'] }}>
            {formatDuration(item.totalSeconds)}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ padding: 24, color: '#9C9A92' }}>
          Walang usage data pa ngayong araw.
        </Text>
      }
    />
  );
}