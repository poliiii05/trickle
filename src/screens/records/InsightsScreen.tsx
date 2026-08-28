import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ShieldCheck, Repeat } from 'lucide-react-native';
import { getBlockStats } from '../../db/blockRepo';
import AppIcon from '../../components/AppIcon';
import Card from '../../components/Card';
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

  const blocks = stats?.totalBlocks ?? 0;
  const attempts = stats?.totalAttempts ?? 0;
  const maxBlocks = Math.max(1, ...(stats?.byApp.map(a => a.blocks) ?? [1]));

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={busy} onRefresh={load} tintColor={colors.primary} />
      }>
      {blocks === 0 ? (
        <EmptyState
          title="Nothing blocked yet"
          body="Once you hit a limit, you'll see how often it happened and how many times you tried to open the app anyway."
        />
      ) : (
        <>
          <View style={s.statRow}>
            <Card style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: colors.primarySoft }]}>
                <ShieldCheck color={colors.primary} size={17} />
              </View>
              <Text style={s.statValue}>{blocks}</Text>
              <Text style={s.statLabel}>times blocked</Text>
            </Card>

            <Card style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: colors.blockedSoft }]}>
                <Repeat color={colors.blocked} size={17} />
              </View>
              <Text style={[s.statValue, { color: colors.blockedDeep }]}>
                {attempts}
              </Text>
              <Text style={s.statLabel}>open attempts</Text>
            </Card>
          </View>

          <Card label="What this means" tone="primary">
            <Text style={s.explainer}>
              {attempts > blocks
                ? `You tried to reopen a locked app ${attempts} times. Each one is a moment the limit did its job.`
                : 'Your limits are holding without much resistance. That is the goal.'}
            </Text>
          </Card>

          <Card label="By app">
            <View style={s.appList}>
              {stats?.byApp.map(a => {
                const ratio = Math.max(0.04, a.blocks / maxBlocks);
                return (
                  <View key={a.packageName} style={s.appRow}>
                    <AppIcon packageName={a.packageName} size={iconSize.sm} />
                    <View style={s.appBody}>
                      <View style={s.appHead}>
                        <Text numberOfLines={1} style={s.appLabel}>
                          {a.packageName}
                        </Text>
                        <Text style={s.appValue}>
                          {`${a.blocks}× · ${a.attempts} tries`}
                        </Text>
                      </View>
                      <View style={s.track}>
                        <View style={[s.fill, { width: `${ratio * 100}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

    statRow: { flexDirection: 'row', gap: spacing.md },
    statCard: { flex: 1, gap: spacing.xs },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    statValue: { fontSize: 30, fontWeight: '700', color: c.text },
    statLabel: { ...typeScale.micro, color: c.textFaint },

    explainer: { ...typeScale.body, color: c.primaryDeep, lineHeight: 22 },

    appList: { gap: spacing.md },
    appRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    appBody: { flex: 1, gap: spacing.xs + 2 },
    appHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    appLabel: { flex: 1, ...typeScale.caption, color: c.text },
    appValue: { ...typeScale.micro, color: c.textMuted },
    track: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill, backgroundColor: c.blocked },
  });
}