import React, { useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLimitsStore } from '../../store/limitsStore';
import { formatDuration, formatCountdown } from '../../utils/time';
import { useLiveLimits } from '../../hooks/useLiveLimits';
import AppIcon from '../../components/AppIcon';
import { useTheme, spacing, radius, type as typeScale } from '../../theme';
import type { Palette } from '../../theme';

export default function AppListScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const { limits, load, toggle } = useLimitsStore();
  const live = useLiveLimits();

  const liveByPkg = useMemo(
    () => new Map(live.map(l => [l.packageName, l])),
    [live],
  );

  useEffect(() => {
    load();
    const unsub = nav.addListener('focus', load);
    return unsub;
  }, [nav, load]);

  return (
    <View style={s.root}>
      <FlatList
        data={limits}
        keyExtractor={i => i.packageName}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.title}>Limits</Text>
            <Text style={s.subtitle}>
              {`${limits.length} apps configured`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const state = liveByPkg.get(item.packageName);
          const remaining = state?.remainingSeconds ?? item.allowanceSeconds;
          const lockedUntil = state?.lockedUntil ?? 0;
          const locked = lockedUntil > Date.now();

          return (
            <Pressable
              onPress={() =>
                nav.navigate('LimitEditor', {
                  packageName: item.packageName,
                  appLabel: item.appLabel,
                })
              }
              style={s.row}>
              <AppIcon packageName={item.packageName} />

              <View style={s.rowBody}>
                <Text numberOfLines={1} style={s.appLabel}>
                  {item.appLabel}
                </Text>

                {locked ? (
                  <Text style={s.lockedText}>
                    {`Locked · ${formatCountdown(lockedUntil - Date.now())}`}
                  </Text>
                ) : (
                  <Text style={s.metaText}>
                    {`${formatDuration(remaining)} left of ${formatDuration(
                      item.allowanceSeconds,
                    )}`}
                  </Text>
                )}
              </View>

              <Switch
                value={item.isActive}
                onValueChange={v => toggle(item.packageName, v)}
                disabled={locked}
                trackColor={{ true: colors.primary, false: colors.disabled }}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              No limits set yet. Tap + to add one.
            </Text>
          </View>
        }
      />

      <Pressable onPress={() => nav.navigate('AppPicker')} style={s.fab}>
        <Text style={s.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: { padding: spacing.xl, paddingBottom: spacing.sm },
    title: { ...typeScale.title, color: c.text },
    subtitle: { ...typeScale.label, color: c.textMuted, marginTop: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md + 2,
      gap: spacing.md + 2,
    },
    rowBody: { flex: 1 },
    appLabel: { ...typeScale.body, color: c.text },
    metaText: { ...typeScale.caption, color: c.textMuted, marginTop: 2 },
    lockedText: { ...typeScale.caption, color: c.blocked, marginTop: 2 },
    empty: { padding: spacing.xl },
    emptyText: { ...typeScale.body, color: c.textFaint, lineHeight: 22 },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: radius.circle,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabIcon: { color: c.primaryOn, fontSize: 28, lineHeight: 32 },
  });
}