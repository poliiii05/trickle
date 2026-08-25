import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, AppState, ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import Permissions from '../../native/Permissions';
import Apps from '../../native/Apps';
import type { UsageStat } from '../../native/types';
import { startOfToday, formatDuration } from '../../utils/time';
import PermissionGate from './PermissionGate';
import { useTheme, spacing, type as typeScale, type Palette } from '../../theme';

export default function TodayScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

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
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasPermission) return <PermissionGate onRecheck={load} />;

  const total = stats.reduce((sum, st) => sum + st.totalSeconds, 0);

  return (
    <FlatList
      style={s.root}
      data={stats}
      keyExtractor={item => item.packageName}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={s.header}>
          <Text style={s.eyebrow}>Screen time today</Text>
          <Text style={s.total}>{formatDuration(total)}</Text>
          <Text style={s.subtitle}>{`${stats.length} apps used`}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text numberOfLines={1} style={s.appLabel}>
            {item.appLabel}
          </Text>
          <Text style={s.duration}>{formatDuration(item.totalSeconds)}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={s.empty}>No usage data yet today.</Text>}
    />
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', backgroundColor: c.bg },
    header: { padding: spacing.xl, paddingBottom: spacing.sm },
    eyebrow: { ...typeScale.label, color: c.textFaint },
    total: { ...typeScale.display, color: c.text },
    subtitle: { ...typeScale.label, color: c.textMuted, marginTop: spacing.xs },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    appLabel: { flex: 1, ...typeScale.body, color: c.text, marginRight: spacing.md },
    duration: { ...typeScale.body, color: c.textMuted, fontVariant: ['tabular-nums'] },
    empty: { padding: spacing.xl, ...typeScale.body, color: c.textFaint },
  });
}