import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { chartScale, formatAxisValue } from '../../utils/chartScale';
import { BarChart } from 'react-native-gifted-charts';
import { Download } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import {
  getDailyInRange,
  getTopApps,
  getUsageSummary,
  exportUsageCsv,
  type DailyPoint,
  type AppTotal,
  type UsageSummary,
} from '../../db/usageRepo';
import {
  buildSeries,
  bucketNoun,
  rangeCaption,
  rangeSinceKey,
  type RangeId,
} from '../../utils/ranges';
import { runSync } from '../../services/syncService';
import { formatDuration } from '../../utils/time';
import Files from '../../native/Files';
import Card from '../../components/Card';
import RangeFilter from '../../components/RangeFilter';
import AppBarChart from '../../components/AppBarChart';
import TopAppsChart from '../../components/TopAppsChart';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../../theme';

function bucketKind(id: RangeId): 'day' | 'week' | 'month' {
  if (id === '1w') return 'day';
  if (id === '1m') return 'week';
  return 'month';
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();

  // Two independent filters — the charts answer different questions
  const [timeRange, setTimeRange] = useState<RangeId>('1w');
  const [appsRange, setAppsRange] = useState<RangeId>('1w');
  const { width: screenWidth } = useWindowDimensions();
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [top, setTop] = useState<AppTotal[]>([]);
  const [busy, setBusy] = useState(false);

  const loadTime = useCallback(async () => {
    const since = rangeSinceKey(timeRange);
    setDaily(await getDailyInRange(since));
    setSummary(await getUsageSummary(since));
  }, [timeRange]);

  const loadApps = useCallback(async () => {
    setTop(await getTopApps(rangeSinceKey(appsRange), 8));
  }, [appsRange]);

  const loadAll = useCallback(async () => {
    setBusy(true);
    try {
      await runSync();
      await loadTime();
      await loadApps();
    } finally {
      setBusy(false);
    }
  }, [loadTime, loadApps]);

  
  useEffect(() => {
    loadAll();
    // Only on mount — the two effects below handle filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTime();
  }, [loadTime]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const series = useMemo(() => buildSeries(daily, timeRange), [daily, timeRange]);
  const peak = useMemo(
    () => Math.max(0, ...series.map(p => Math.round(p.total / 60))),
    [series],
  );

  const scale = useMemo(
    () => chartScale(peak, bucketKind(timeRange)),
    [peak, timeRange],
  );

  const bars = useMemo(
    () =>
      series.map(p => {
        const minutes = Math.round(p.total / 60);
        return {
          value: minutes,
          label: p.label,
          frontColor: minutes === 0 ? colors.surfaceAlt : colors.primary,
        };
      }),
    [series, colors.primary, colors.surfaceAlt],
  );

  // Fill the available width regardless of how many buckets there are
    // Card padding (16×2), screen padding (16×2), y-axis label width
  const plotWidth = Math.max(180, screenWidth - 32 - 32 - 38);

    const layout = useMemo(() => {
    const n = Math.max(1, series.length);
    const slot = plotWidth / n;
    const barWidth = Math.max(10, Math.min(56, Math.round(slot * 0.58)));
    const gap = Math.max(6, Math.round(slot - barWidth));
    return { barWidth, gap, initial: Math.round(gap / 2) };
  }, [series.length, plotWidth]);

  

  const onExport = async () => {
    try {
      const csv = await exportUsageCsv();
      await Files.shareCsv(`trickle-usage-${Date.now()}.csv`, csv);
    } catch {
      toast.show('Export failed', 'error');
    }
  };

  const hasAnyData = daily.length > 0 || top.length > 0;

  if (!hasAnyData && !busy) {
    return (
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={busy} onRefresh={loadAll} tintColor={colors.primary} />
        }>
        <EmptyState
          title="No usage recorded yet"
          body="Trickle takes a snapshot each time you open it. Come back tomorrow and you'll see your first chart."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={busy} onRefresh={loadAll} tintColor={colors.primary} />
      }>
      {/* ---------- Screen time ---------- */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Screen time</Text>
        <RangeFilter value={timeRange} onChange={setTimeRange} />
      </View>

      <Card label="Summary">
        <View style={s.statGrid}>
          <View style={s.statItem}>
            <Text style={s.statValue}>
              {formatDuration(summary?.dailyAverage ?? 0)}
            </Text>
            <Text style={s.statLabel}>daily average</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.accentDeep }]}>
              {formatDuration(summary?.peakTotal ?? 0)}
            </Text>
            <Text style={s.statLabel}>busiest day</Text>
          </View>
        </View>

        <View style={s.statFooter}>
          <Text style={s.statFooterText}>
            {`${formatDuration(summary?.total ?? 0)} total across ${
              summary?.trackedDays ?? 0
            } tracked ${summary?.trackedDays === 1 ? 'day' : 'days'}`}
          </Text>
        </View>
      </Card>

            <Card label={`Screen time ${bucketNoun(timeRange)}`}>
        <View style={s.chartHead}>
          <Text style={s.chartRange}>{rangeCaption(timeRange)}</Text>
          <Text style={s.chartHint}>{formatAxisValue(scale.max)} max</Text>
        </View>

        <View style={s.chartBody}>
            <BarChart
            data={bars}
            width={plotWidth}
            barWidth={layout.barWidth}
            spacing={layout.gap}
            initialSpacing={layout.initial}
            endSpacing={layout.initial}
            maxValue={scale.max}
            noOfSections={scale.sections}
            formatYLabel={(v: string) => formatAxisValue(Number(v))}
            yAxisThickness={0}
            xAxisThickness={1.5}
            xAxisColor={colors.borderStrong}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            xAxisLabelTextStyle={s.chartXLabel}
            yAxisTextStyle={s.chartYLabel}
            yAxisLabelWidth={38}
            disableScroll
            hideRules
          />
        </View>
      </Card>

      {/* ---------- Top apps ---------- */}
      <View style={[s.section, s.sectionSpaced]}>
        <Text style={s.sectionTitle}>Top apps</Text>
        <RangeFilter value={appsRange} onChange={setAppsRange} />
      </View>

      <Card label={rangeCaption(appsRange)}>
                {top.length > 0 ? (
          <TopAppsChart data={top} bucket={bucketKind(appsRange)} />
        ) : (
          <Text style={s.emptyText}>Nothing tracked in this range.</Text>
        )}
      </Card>

      <Card label="Full breakdown">
        {top.length > 0 ? (
          <AppBarChart data={top} />
        ) : (
          <Text style={s.emptyText}>Nothing tracked in this range.</Text>
        )}
      </Card>

      <Pressable onPress={onExport} style={s.exportButton}>
        <Download color={colors.text} size={16} />
        <Text style={s.exportText}>Export all data as CSV</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

    section: { gap: spacing.md },
    sectionSpaced: { marginTop: spacing.lg },
    sectionTitle: { ...typeScale.heading, color: c.text },

    statGrid: { flexDirection: 'row', alignItems: 'center' },
    statItem: { flex: 1, gap: 2 },
    statValue: { fontSize: 26, fontWeight: '700', color: c.text },
    statLabel: { ...typeScale.micro, color: c.textFaint },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: c.border,
      marginHorizontal: spacing.lg,
    },
    statFooter: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    statFooterText: { ...typeScale.micro, color: c.textMuted },

      chartBody: { marginLeft: -spacing.xs },
    chartHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.md,
    },
    chartRange: { ...typeScale.caption, color: c.text, fontWeight: '600' },
    chartHint: { ...typeScale.micro, color: c.textFaint },
    chartXLabel: { fontSize: 10, color: c.textFaint },
    chartYLabel: { fontSize: 10, color: c.textFaint },

    emptyText: { ...typeScale.caption, color: c.textFaint },

    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md + 2,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: spacing.xs,
    },
    exportText: { ...typeScale.body, color: c.text },
  });
}