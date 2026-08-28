import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  Switch,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLimitsStore } from '../../store/limitsStore';
import { formatDuration, formatCountdown } from '../../utils/time';
import { useLiveLimits } from '../../hooks/useLiveLimits';
import type { AppLimit } from '../../db/limitsRepo';
import AppIcon from '../../components/AppIcon';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import EmptyState from '../../components/EmptyState';
import { Play, PauseCircle } from 'lucide-react-native';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';

import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../../theme';

function relativeDay(ms: number | null): string {
  if (!ms) return 'Paused';
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days <= 0) return 'Paused today';
  if (days === 1) return 'Paused yesterday';
  if (days < 7) return `Paused ${days} days ago`;
  if (days < 30) return `Paused ${Math.floor(days / 7)}w ago`;
  return `Paused ${Math.floor(days / 30)}mo ago`;
}

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

  const lockedCount = useMemo(
    () => live.filter(l => l.lockedUntil > Date.now()).length,
    [live],
  );

    const toast = useToast();
  const [pending, setPending] = useState<{ item: AppLimit; next: boolean } | null>(
    null,
  );

  const runToggle = async () => {
    if (!pending) return;
    const { item, next } = pending;
    setPending(null);
    await toggle(item.packageName, next);
    toast.show(
      next ? `${item.appLabel} limit enabled` : `${item.appLabel} moved to Paused`,
      next ? 'success' : 'info',
    );
  };

  const sections = useMemo(() => {
    const active = limits.filter(l => l.isActive);
    const paused = limits.filter(l => !l.isActive);
    const out: { title: string; hint: string; data: AppLimit[] }[] = [];

    if (active.length) {
      out.push({
        title: 'Active',
        hint: `${active.length} enforcing`,
        data: active,
      });
    }
    if (paused.length) {
      out.push({
        title: 'Paused',
        hint: `${paused.length} on hold`,
        data: paused,
      });
    }
    return out;
  }, [limits]);

  return (
    <View style={s.root}>
      <SectionList
        contentContainerStyle={s.content}
        sections={sections}
        keyExtractor={i => i.packageName}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          limits.length > 0 ? (
            <Card label="Overview" style={s.summaryCard}>
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryValue}>{limits.length}</Text>
                  <Text style={s.summaryLabel}>configured</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryItem}>
                  <Text
                    style={[
                      s.summaryValue,
                      lockedCount > 0 && { color: colors.blocked },
                    ]}>
                    {lockedCount}
                  </Text>
                  <Text style={s.summaryLabel}>locked now</Text>
                </View>
              </View>
            </Card>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionHint}>{section.hint}</Text>
          </View>
        )}
        renderItem={({ item, section }) => {
          const paused = section.title === 'Paused';
          const state = liveByPkg.get(item.packageName);
          const remaining = state?.remainingSeconds ?? item.allowanceSeconds;
          const lockedUntil = state?.lockedUntil ?? 0;
          const locked = !paused && lockedUntil > Date.now();

          const used = Math.max(0, item.allowanceSeconds - remaining);
          const usedRatio =
            item.allowanceSeconds > 0 ? used / item.allowanceSeconds : 0;
          const lockRatio = locked
            ? 1 - (lockedUntil - Date.now()) / (item.lockSeconds * 1000)
            : 0;

          const tone = locked ? 'blocked' : usedRatio > 0.75 ? 'warning' : 'primary';

          return (
            <Pressable
              onPress={() =>
                nav.navigate('LimitEditor', {
                  packageName: item.packageName,
                  appLabel: item.appLabel,
                })
              }
              style={({ pressed }) => [
                s.itemCard,
                paused && s.itemPaused,
                pressed && s.itemPressed,
              ]}>
              <View style={s.itemHead}>
                <View style={paused ? s.dimmed : undefined}>
                  <AppIcon packageName={item.packageName} />
                </View>

                <View style={s.itemTitleBlock}>
                  <Text
                    numberOfLines={1}
                    style={[s.appLabel, paused && s.textDim]}>
                    {item.appLabel}
                  </Text>
                  <Text style={s.itemRule}>
                    {`${formatDuration(item.allowanceSeconds)} · then ${formatDuration(
                      item.lockSeconds,
                    )} lock`}
                  </Text>
                </View>

                 <Switch
                  value={item.isActive}
                  onValueChange={v => setPending({ item, next: v })}
                  disabled={locked}
                  trackColor={{ true: colors.primary, false: colors.disabled }}
                />
              </View>

              {paused ? (
                <Text style={s.pausedNote}>{relativeDay(item.lastActiveAt)}</Text>
              ) : (
                <View style={s.itemMeter}>
                  <View style={s.meterHead}>
                    <Text
                      style={[s.meterLabel, locked && { color: colors.blocked }]}>
                      {locked ? 'Locked' : 'Remaining'}
                    </Text>
                    <Text
                      style={[s.meterValue, locked && { color: colors.blocked }]}>
                      {locked
                        ? formatCountdown(lockedUntil - Date.now())
                        : formatDuration(remaining)}
                    </Text>
                  </View>
                  <ProgressBar progress={locked ? lockRatio : usedRatio} tone={tone} />
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No limits yet"
            body="Pick an app and decide how much time you want to give it each day."
            actionLabel="Add your first limit"
            onAction={() => nav.navigate('AppPicker')}
          />
        }
      />

      <Pressable onPress={() => nav.navigate('AppPicker')} style={s.fab}>
        <Text style={s.fabIcon}>+</Text>
      </Pressable>

          <ConfirmModal
        visible={pending !== null}
        tone={pending?.next ? 'primary' : 'blocked'}
        icon={
          pending?.next ? (
            <Play color={colors.primary} size={22} />
          ) : (
            <PauseCircle color={colors.blocked} size={22} />
          )
        }
        title={pending?.next ? 'Enable this limit?' : 'Pause this limit?'}
        body={
          pending
            ? pending.next
              ? `${pending.item.appLabel} will be limited to ${formatDuration(
                  pending.item.allowanceSeconds,
                )}, then locked for ${formatDuration(pending.item.lockSeconds)}.`
              : `${pending.item.appLabel} moves to Paused. Your settings are kept, and nothing will be blocked until you turn it back on.`
            : ''
        }
        confirmLabel={pending?.next ? 'Enable' : 'Pause'}
        onConfirm={runToggle}
        onCancel={() => setPending(null)}
      />

      
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 96 },

    summaryCard: { marginBottom: spacing.xs },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, gap: 2 },
    summaryValue: { fontSize: 30, fontWeight: '600', color: c.text },
    summaryLabel: { ...typeScale.caption, color: c.textMuted },
    summaryDivider: {
      width: 1,
      height: 34,
      backgroundColor: c.border,
      marginHorizontal: spacing.lg,
    },

    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm,
    },
    sectionTitle: {
      ...typeScale.micro,
      color: c.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '600',
    },
    sectionHint: { ...typeScale.micro, color: c.textFaint },

    itemCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    itemPaused: { backgroundColor: c.bg, gap: spacing.sm },
    itemPressed: { opacity: 0.7 },
    dimmed: { opacity: 0.45 },
    textDim: { color: c.textMuted },

    itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    itemTitleBlock: { flex: 1, gap: 2 },
    appLabel: { ...typeScale.body, color: c.text },
    itemRule: { ...typeScale.caption, color: c.textMuted },

    pausedNote: { ...typeScale.micro, color: c.textFaint },

    itemMeter: { gap: spacing.sm },
    meterHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    meterLabel: { ...typeScale.micro, color: c.textFaint },
    meterValue: {
      ...typeScale.caption,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },

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