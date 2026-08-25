import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  AppState,
  Alert,
  StyleSheet,
} from 'react-native';
import Tracking from '../../native/Tracking';
import Permissions from '../../native/Permissions';
import type { PermissionStatus } from '../../native/types';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type ThemeMode,
  type Palette,
} from '../../theme';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

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

  const statusDetail = !a11yEnabled
    ? 'The accessibility service is turned off.'
    : !serviceRunning
    ? 'The service is not running — it may have been killed by battery optimization.'
    : 'Blocking is turned off.';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={[s.banner, healthy ? s.bannerOk : s.bannerBad]}>
        <Text style={[s.bannerTitle, healthy ? s.bannerTextOk : s.bannerTextBad]}>
          {healthy ? 'Trickle is active' : 'Trickle is not active'}
        </Text>
        {!healthy && <Text style={s.bannerDetail}>{statusDetail}</Text>}
      </View>

      <Row
        colors={colors}
        title="Blocking"
        subtitle="The master switch. Turn this off if you need emergency access."
        right={
          <Switch
            value={monitoring}
            onValueChange={onToggleMonitoring}
            trackColor={{ true: colors.primary, false: colors.disabled }}
          />
        }
      />

      <Text style={s.sectionLabel}>Permissions</Text>

      <PermRow
        colors={colors}
        title="Accessibility service"
        ok={a11yEnabled}
        required
        onPress={() => Tracking.openAccessibilitySettings()}
      />
      <PermRow
        colors={colors}
        title="Usage access"
        ok={perms?.usageStats ?? false}
        required
        onPress={() => Permissions.openUsageAccessSettings()}
      />
      <PermRow
        colors={colors}
        title="Display over other apps"
        ok={perms?.overlay ?? false}
        onPress={() => Permissions.openOverlaySettings()}
      />
      <PermRow
        colors={colors}
        title="Ignore battery optimization"
        ok={perms?.batteryExempt ?? false}
        onPress={() => Permissions.openBatteryOptimizationSettings()}
      />

      <Text style={s.hint}>
        On Honor, Xiaomi, Oppo, Vivo, and Realme devices, also find "App launch" or
        "Autostart" in the app settings and set Trickle to manual with every toggle
        on. Otherwise the system will kill the service.
      </Text>

      <Text style={s.sectionLabel}>Appearance</Text>

      <View style={s.segmented}>
        {MODES.map(m => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[s.segment, active ? s.segmentActive : s.segmentIdle]}>
              <Text style={[s.segmentText, active ? s.segmentTextActive : s.segmentTextIdle]}>
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onClearLocks} style={s.clearButton}>
        <Text style={s.clearText}>Clear all locks</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  colors,
  title,
  subtitle,
  right,
}: {
  colors: Palette;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.row}>
      <View style={s.rowBody}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function PermRow({
  colors,
  title,
  ok,
  required,
  onPress,
}: {
  colors: Palette;
  title: string;
  ok: boolean;
  required?: boolean;
  onPress: () => void;
}) {
  const s = useMemo(() => makeStyles(colors), [colors]);
  const dotColor = ok ? colors.primary : required ? colors.blocked : colors.disabled;

  return (
    <Pressable onPress={onPress} style={s.permRow}>
      <View style={[s.dot, { backgroundColor: dotColor }]} />
      <Text style={s.permTitle}>{title}</Text>
      <Text style={[s.permAction, { color: ok ? colors.textMuted : colors.primary }]}>
        {ok ? 'Ok' : 'Set up'}
      </Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.xl, gap: spacing.xl },

    banner: { padding: spacing.lg, borderRadius: radius.md },
    bannerOk: { backgroundColor: c.primarySoft },
    bannerBad: { backgroundColor: c.blockedSoft },
    bannerTitle: { ...typeScale.bodyStrong },
    bannerTextOk: { color: c.primaryDeep },
    bannerTextBad: { color: c.blockedDeep },
    bannerDetail: {
      ...typeScale.caption,
      color: c.blockedDeep,
      marginTop: spacing.xs + 2,
      lineHeight: 20,
    },

    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    rowBody: { flex: 1 },
    rowTitle: { ...typeScale.body, color: c.text },
    rowSubtitle: {
      ...typeScale.caption,
      color: c.textMuted,
      marginTop: spacing.xs,
      lineHeight: 19,
    },

    sectionLabel: { ...typeScale.label, color: c.textFaint, marginTop: spacing.sm },

    permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dot: { width: 10, height: 10, borderRadius: 5 },
    permTitle: { flex: 1, ...typeScale.body, color: c.text },
    permAction: { ...typeScale.label },

    hint: {
      ...typeScale.caption,
      color: c.textFaint,
      lineHeight: 20,
      marginTop: spacing.sm,
    },

    segmented: { flexDirection: 'row', gap: spacing.sm },
    segment: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: c.primary },
    segmentIdle: { backgroundColor: c.surfaceAlt },
    segmentText: { ...typeScale.label, textTransform: 'capitalize' },
    segmentTextActive: { color: c.primaryOn },
    segmentTextIdle: { color: c.text },

    clearButton: { padding: spacing.md, marginTop: spacing.lg },
    clearText: { ...typeScale.body, color: c.danger, textAlign: 'center' },
  });
}