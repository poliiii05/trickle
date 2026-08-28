import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  AppState,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Permissions from '../../native/Permissions';
import Apps from '../../native/Apps';
import type { UsageStat } from '../../native/types';
import { startOfToday, formatDuration } from '../../utils/time';
import { useLimitsStore } from '../../store/limitsStore';
import { useLiveLimits } from '../../hooks/useLiveLimits';
import PermissionGate from './PermissionGate';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import AppIcon from '../../components/AppIcon';
import {
  useTheme,
  spacing,
  radius,
  iconSize,
  type as typeScale,
  type Palette,
} from '../../theme';

type LimitState = 'none' | 'running' | 'locked';

export default function TodayScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const { limits, load: loadLimits } = useLimitsStore();
  const live = useLiveLimits();

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
      await loadLimits();
    } finally {
      setLoading(false);
    }
  }, [loadLimits]);

  useEffect(() => {
    load();

    // Reload whenever this tab comes back into focus — a limit may have
    // been added or removed in the editor while we were away.
    const unsubFocus = nav.addListener('focus', load);

    const sub = AppState.addEventListener('change', next => {
      if (appState.current?.match(/inactive|background/) && next === 'active') {
        load();
      }
      appState.current = next;
    });

    return () => {
      unsubFocus();
      sub.remove();
    };
  }, [load, nav]);

  const liveByPkg = useMemo(
    () => new Map(live.map(l => [l.packageName, l])),
    [live],
  );

  /** Only active limits count — paused and removed apps show nothing. */
  const limitStateFor = useCallback(
    (packageName: string): LimitState => {
      const config = limits.find(l => l.packageName === packageName);
      if (!config || !config.isActive) return 'none';

      const state = liveByPkg.get(packageName);
      if (state && state.lockedUntil > Date.now()) return 'locked';
      return 'running';
    },
    [limits, liveByPkg],
  );

  if (hasPermission === null) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasPermission) return <PermissionGate onRecheck={load} />;

  const total = stats.reduce((sum, st) => sum + st.totalSeconds, 0);
  const busiest = stats[0];
  const busiestShare = busiest && total > 0 ? busiest.totalSeconds / total : 0;

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
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
        <View style={s.headerBlock}>
          <Card label="Screen time today" style={s.heroCard}>
            <Text style={s.heroValue}>{formatDuration(total)}</Text>
            <Text style={s.heroMeta}>
              {`across ${stats.length} ${stats.length === 1 ? 'app' : 'apps'}`}
            </Text>

            {busiest && (
              <View style={s.heroBreakdown}>
                <View style={s.heroBreakdownHead}>
                  <Text style={s.heroBreakdownLabel}>Most used</Text>
                  <Text style={s.heroBreakdownValue}>
                    {`${busiest.appLabel} · ${formatDuration(busiest.totalSeconds)}`}
                  </Text>
                </View>
                <ProgressBar progress={busiestShare} tone="accent" />
              </View>
            )}

            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.legendSwatch, s.swatchRunning]} />
                <Text style={s.legendText}>Limit set</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendSwatch, s.swatchLocked]} />
                <Text style={s.legendText}>Locked now</Text>
              </View>
            </View>
          </Card>

          <View style={s.listHead}>
            <Text style={s.listHeadTitle}>All apps</Text>
            <Text style={s.listHeadHint}>Tap to set a limit</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const share = total > 0 ? item.totalSeconds / total : 0;
        const state = limitStateFor(item.packageName);

        return (
          <Pressable
            onPress={() =>
              nav.navigate('LimitEditor', {
                packageName: item.packageName,
                appLabel: item.appLabel,
              })
            }
            style={({ pressed }) => [
              s.row,
              state === 'running' && s.rowRunning,
              state === 'locked' && s.rowLocked,
              pressed && s.rowPressed,
            ]}>
            <AppIcon packageName={item.packageName} size={iconSize.sm} />

            <View style={s.rowBody}>
              <View style={s.rowTop}>
                <Text numberOfLines={1} style={s.appLabel}>
                  {item.appLabel}
                </Text>
                <Text style={s.duration}>{formatDuration(item.totalSeconds)}</Text>
              </View>
              <ProgressBar
                progress={share}
                height={4}
                tone={state === 'locked' ? 'blocked' : 'accent'}
              />
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={<Text style={s.empty}>No usage data yet today.</Text>}
    />
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { paddingBottom: spacing.xxl },
    center: { flex: 1, justifyContent: 'center', backgroundColor: c.bg },

    headerBlock: { padding: spacing.lg, gap: spacing.lg },
    heroCard: { gap: spacing.xs },
    heroValue: { ...typeScale.display, color: c.text },
    heroMeta: { ...typeScale.label, color: c.textMuted },
    heroBreakdown: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: spacing.sm,
    },
    heroBreakdownHead: { gap: 2 },
    heroBreakdownLabel: { ...typeScale.micro, color: c.textFaint },
    heroBreakdownValue: { ...typeScale.caption, color: c.text },

    legend: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 4,
      borderWidth: 2,
    },
    swatchRunning: { borderColor: c.primaryBorder, backgroundColor: c.primarySoft },
    swatchLocked: { borderColor: c.blockedBorder, backgroundColor: c.blockedSoft },
    legendText: { ...typeScale.micro, color: c.textFaint },

    listHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.lg,
    },
    listHeadTitle: { ...typeScale.bodyStrong, color: c.text },
    listHeadHint: { ...typeScale.micro, color: c.textFaint },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: c.bg,
    },
    rowRunning: { borderColor: c.primaryBorder, backgroundColor: c.surface },
    rowLocked: { borderColor: c.blockedBorder, backgroundColor: c.blockedSoft },
    rowPressed: { opacity: 0.7 },

    rowBody: { flex: 1, gap: spacing.sm },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    appLabel: { flex: 1, ...typeScale.body, color: c.text },
    duration: {
      ...typeScale.caption,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },

    empty: {
      padding: spacing.xl,
      ...typeScale.body,
      color: c.textFaint,
      textAlign: 'center',
    },
  });
}