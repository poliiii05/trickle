import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { getDailyTotals, getTopApps, exportUsageCsv } from '../../db/usageRepo';
import { runSync } from '../../services/syncService';
import { formatDuration } from '../../utils/time';
import Files from '../../native/Files';
import AppIcon from '../../components/AppIcon';
import {
  useTheme,
  spacing,
  radius,
  iconSize,
  type as typeScale,
  type Palette,
} from '../../theme';

const RANGES = [7, 30] as const;
type Range = (typeof RANGES)[number];

export default function HistoryScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [range, setRange] = useState<Range>(7);
  const [daily, setDaily] = useState<{ day: string; total: number }[]>([]);
  const [top, setTop] = useState<{ packageName: string; total: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      await runSync();
      setDaily(await getDailyTotals(range));
      setTop(await getTopApps(range));
    } finally {
      setBusy(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const bars = useMemo(
    () =>
      daily.map(d => ({
        value: Math.round(d.total / 60),
        label: d.day.slice(5).replace('-', '/'),
        frontColor: colors.primary,
      })),
    [daily, colors.primary],
  );

  const onExport = async () => {
    try {
      const csv = await exportUsageCsv();
      await Files.shareCsv(`trickle-${Date.now()}.csv`, csv);
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={busy}
          onRefresh={load}
          tintColor={colors.primary}
        />
      }>
      <View style={s.pills}>
        {RANGES.map(r => {
          const active = range === r;
          return (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[s.pill, active ? s.pillActive : s.pillIdle]}>
              <Text style={[s.pillText, active ? s.pillTextActive : s.pillTextIdle]}>
                {`${r} days`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.card}>
        <Text style={s.cardLabel}>Screen time per day (minutes)</Text>
        {bars.length > 0 ? (
          <BarChart
            data={bars}
            barWidth={range === 7 ? 24 : 8}
            spacing={range === 7 ? 16 : 4}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisLabelTextStyle={{ fontSize: 9, color: colors.textFaint }}
            yAxisTextStyle={{ fontSize: 10, color: colors.textFaint }}
            hideRules
          />
        ) : (
          <Text style={s.emptyText}>No data yet.</Text>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Most used</Text>
        {top.length === 0 ? (
          <Text style={s.emptyText}>Nothing tracked yet.</Text>
        ) : (
          top.map(t => (
            <View key={t.packageName} style={s.row}>
              <AppIcon packageName={t.packageName} size={iconSize.sm} />
              <Text numberOfLines={1} style={s.rowLabel}>
                {t.packageName}
              </Text>
              <Text style={s.rowValue}>{formatDuration(t.total)}</Text>
            </View>
          ))
        )}
      </View>

      <Pressable onPress={onExport} style={s.exportButton}>
        <Text style={s.exportText}>Export as CSV</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.xl, gap: spacing.xl },

    pills: { flexDirection: 'row', gap: spacing.sm },
    pill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    pillActive: { backgroundColor: c.primary },
    pillIdle: { backgroundColor: c.surfaceAlt },
    pillText: { ...typeScale.label },
    pillTextActive: { color: c.primaryOn },
    pillTextIdle: { color: c.text },

    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    cardLabel: { ...typeScale.label, color: c.textMuted, marginBottom: spacing.md },

    section: { gap: spacing.xs },
    sectionLabel: {
      ...typeScale.label,
      color: c.textMuted,
      marginBottom: spacing.sm,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowLabel: { flex: 1, ...typeScale.body, color: c.text },
    rowValue: { ...typeScale.label, color: c.textMuted },

    emptyText: { ...typeScale.body, color: c.textFaint },

    exportButton: {
      padding: spacing.md + 2,
      borderRadius: radius.md,
      backgroundColor: c.surfaceAlt,
    },
    exportText: { ...typeScale.body, color: c.text, textAlign: 'center' },
  });
}