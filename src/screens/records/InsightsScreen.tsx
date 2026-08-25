import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { getBlockStats } from '../../db/blockRepo';
import AppIcon from '../../components/AppIcon';
import EmptyState from '../../components/EmptyState';
import {
  useTheme,
  spacing,
  radius,
  iconSize,
  type as typeScale,
  type Palette,
} from '../../theme';

type Stats = Awaited<ReturnType<typeof getBlockStats>>;

export default function InsightsScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setStats(await getBlockStats(30));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      <Text style={s.eyebrow}>Last 30 days</Text>

      <View style={s.statRow}>
        <Stat colors={colors} label="Times blocked" value={stats?.totalBlocks ?? 0} />
        <Stat colors={colors} label="Open attempts" value={stats?.totalAttempts ?? 0} />
      </View>

      {stats && stats.byApp.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>By app</Text>
          {stats.byApp.map(a => (
            <View key={a.packageName} style={s.row}>
              <AppIcon packageName={a.packageName} size={iconSize.sm} />
              <Text numberOfLines={1} style={s.rowLabel}>
                {a.packageName}
              </Text>
              <Text style={s.rowValue}>
                {`${a.blocks}× · ${a.attempts} attempts`}
              </Text>
            </View>
          ))}
        </View>
      )}

       {stats && stats.totalBlocks === 0 && (
        <EmptyState
          title="Nothing blocked yet"
          body="Once you hit a limit, you'll see how often it happened and how many times you tried to open the app anyway."
        />
      )}
    </ScrollView>
  );
}

function Stat({
  colors,
  label,
  value,
}: {
  colors: Palette;
  label: string;
  value: number;
}) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.xl, gap: spacing.xl },

    eyebrow: { ...typeScale.label, color: c.textFaint },

    statRow: { flexDirection: 'row', gap: spacing.md },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    statValue: { fontSize: 32, fontWeight: '600', color: c.text },
    statLabel: { ...typeScale.caption, color: c.textMuted, marginTop: spacing.xs },

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

    emptyText: { ...typeScale.body, color: c.textFaint, lineHeight: 22 },
  });
}