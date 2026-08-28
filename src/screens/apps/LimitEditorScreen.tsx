import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Minus, Plus, Lock, AlertCircle, Play, PauseCircle, Trash2 } from 'lucide-react-native';
import { useLimitsStore } from '../../store/limitsStore';
import { isLocked } from '../../db/limitsRepo';
import { splitDuration, joinDuration, formatCountdown, formatDuration } from '../../utils/time';
import AppIcon from '../../components/AppIcon';
import Card from '../../components/Card';

import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import {
  useTheme,
  spacing,
  radius,
  iconSize,
  type as typeScale,
  type Palette,
} from '../../theme';

const MAX_ALLOWANCE = 1440;   // 24 hours
const MAX_HOURS = 23;
const MAX_MINUTES = 59;

const PRESETS = [
  { label: 'Daily 20m', allowance: 20, lockH: 23, lockM: 40 },
  { label: 'Daily 1h', allowance: 60, lockH: 23, lockM: 0 },
  { label: 'Pomodoro', allowance: 25, lockH: 0, lockM: 5 },
  { label: 'Short break', allowance: 20, lockH: 0, lockM: 10 },
  { label: 'Long break', allowance: 45, lockH: 2, lockM: 0 },
];

/** Digits only, no leading zeros beyond one, empty allowed while typing. */
function sanitize(text: string): string {
  const digits = text.replace(/[^0-9]/g, '');
  if (digits === '') return '';
  return String(parseInt(digits, 10));
}

function toInt(text: string): number {
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
}

export default function LimitEditorScreen() {
  const nav = useNavigation<any>();
  const { packageName, appLabel } = useRoute<any>().params;
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const { byPackage, save, remove, toggle, load } = useLimitsStore();
  const existing = byPackage(packageName);
  const locked = existing ? isLocked(existing) : false;
  const toast = useToast();
  const [dialog, setDialog] = useState<'enable' | 'disable' | 'remove' | null>(null);

  // Text state so the user can clear a field and retype freely
  const [allowanceText, setAllowanceText] = useState('20');
  const [hoursText, setHoursText] = useState('0');
  const [minsText, setMinsText] = useState('10');

  useEffect(() => {
    if (!existing) return;
    setAllowanceText(String(Math.round(existing.allowanceSeconds / 60)));
    const { hours, minutes } = splitDuration(existing.lockSeconds);
    setHoursText(String(hours));
    setMinsText(String(minutes));
  }, [existing]);

  const allowance = toInt(allowanceText);
  const hours = toInt(hoursText);
  const minutes = toInt(minsText);
  const lockSeconds = joinDuration(hours, minutes);

  // --- Validation ---
  const allowanceError =
    allowanceText === ''
      ? 'Enter a number.'
      : allowance < 1
      ? 'Must be at least 1 minute.'
      : allowance > MAX_ALLOWANCE
      ? `Too high — the maximum is ${MAX_ALLOWANCE} minutes (24 hours).`
      : null;

  const lockError =
    hours > MAX_HOURS
      ? `Hours cannot exceed ${MAX_HOURS}.`
      : minutes > MAX_MINUTES
      ? `Minutes cannot exceed ${MAX_MINUTES}.`
      : hours === 0 && minutes === 0
      ? 'Lock must be at least 1 minute.'
      : null;

  const canSave = !locked && !allowanceError && !lockError;

  // --- Editing ---
   const onAllowanceChange = (text: string) => {
    setAllowanceText(sanitize(text));
  };

  const onHoursChange = (text: string) => {
    const clean = sanitize(text);
    setHoursText(clean);
    if (toInt(clean) === MAX_HOURS && minutes > MAX_MINUTES) {
      setMinsText(String(MAX_MINUTES));
    }
  };

  const onMinsChange = (text: string) => {
    setMinsText(sanitize(text));
  };

  const blur = (text: string, setter: (v: string) => void, fallback: number) => {
    if (text === '') setter(String(fallback));
  };

  const step = (
    text: string,
    setter: (v: string) => void,
    delta: number,
    min: number,
    max: number,
  ) => {
    if (locked) return;
    const next = Math.max(min, Math.min(max, toInt(text) + delta));
    setter(String(next));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    if (locked) return;
    setAllowanceText(String(p.allowance));
    setHoursText(String(p.lockH));
    setMinsText(String(p.lockM));
  };

  // --- Actions ---
   const onSave = async () => {
    if (!canSave) return;
    const isNew = !existing;
    await save({
      packageName,
      appLabel,
      allowanceSeconds: allowance * 60,
      lockSeconds,
    });
    toast.show(isNew ? 'Limit set' : 'Limit updated');
    nav.goBack();
  };

  const runDisable = async () => {
    setDialog(null);
    await toggle(packageName, false);
    toast.show(`${appLabel} moved to Paused`, 'info');
    nav.goBack();
  };

  const runEnable = async () => {
    setDialog(null);
    await toggle(packageName, true);
    toast.show(`${appLabel} limit enabled`);
    nav.goBack();
  };

  const runRemove = async () => {
    setDialog(null);
    await remove(packageName);
    await load();
    toast.show('Limit removed', 'info');
    nav.goBack();
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Card style={s.appCard}>
        <AppIcon packageName={packageName} size={iconSize.lg} />
        <View style={s.appMeta}>
          <Text numberOfLines={1} style={s.appName}>
            {appLabel}
          </Text>
          <Text numberOfLines={1} style={s.appPackage}>
            {packageName}
          </Text>
        </View>
      </Card>

      {locked && existing?.lockedUntil && (
        <Card tone="blocked" style={s.noticeCard}>
          <Lock color={colors.blockedDeep} size={18} />
          <Text style={s.lockedText}>
            {`Locked for ${formatCountdown(
              existing.lockedUntil - Date.now(),
            )}. Settings are frozen until then.`}
          </Text>
        </Card>
      )}

      {existing && !existing.isActive && !locked && (
        <Card tone="blocked" style={s.noticeCard}>
          <AlertCircle color={colors.blockedDeep} size={18} />
          <Text style={s.lockedText}>
            This limit is paused. Nothing is being blocked.
          </Text>
        </Card>
      )}

      <Card label="How it works" tone="primary">
        <Text style={s.explainer}>
          {`You get ${formatDuration(
            allowance * 60,
          )} in this app. When it runs out, it locks for ${formatDuration(
            lockSeconds,
          )}, then the allowance resets.`}
        </Text>
        <Text style={s.explainerMeta}>
          {`Full cycle · ${formatDuration(allowance * 60 + lockSeconds)}`}
        </Text>
      </Card>

      <Card label="Screen time">
        <View style={s.stepper}>
          <Pressable
            onPress={() => step(allowanceText, setAllowanceText, -5, 1, MAX_ALLOWANCE)}
            disabled={locked}
            style={[s.stepButton, locked && s.stepDisabled]}>
            <Minus color={locked ? colors.textFaint : colors.text} size={18} />
          </Pressable>

          <View style={s.stepperValue}>
              <TextInput
              value={allowanceText}
              onChangeText={onAllowanceChange}
              onBlur={() => blur(allowanceText, setAllowanceText, 20)}
              keyboardType="number-pad"
              editable={!locked}
              selectTextOnFocus
              style={[s.stepperInput, !!allowanceError && s.inputError]}
            />
            <Text style={s.stepperUnit}>minutes</Text>
          </View>

          <Pressable
            onPress={() => step(allowanceText, setAllowanceText, 5, 1, MAX_ALLOWANCE)}
            disabled={locked}
            style={[s.stepButton, locked && s.stepDisabled]}>
            <Plus color={locked ? colors.textFaint : colors.text} size={18} />
          </Pressable>
        </View>

        {allowanceError ? (
          <Text style={s.errorText}>{allowanceError}</Text>
        ) : (
          <Text style={s.helperText}>{`1 – ${MAX_ALLOWANCE} minutes`}</Text>
        )}
      </Card>

      <Card label="Lock duration">
        <View style={s.dualRow}>
          <View style={s.dualCol}>
            <Text style={s.dualLabel}>Hours</Text>
            <View style={s.stepper}>
              <Pressable
                onPress={() => step(hoursText, setHoursText, -1, 0, MAX_HOURS)}
                disabled={locked}
                style={[s.stepButtonSm, locked && s.stepDisabled]}>
                <Minus color={locked ? colors.textFaint : colors.text} size={14} />
              </Pressable>
                <TextInput
                value={hoursText}
                onChangeText={onHoursChange}
                onBlur={() => blur(hoursText, setHoursText, 0)}
                keyboardType="number-pad"
                editable={!locked}
                selectTextOnFocus
                style={[s.dualInput, hours > MAX_HOURS && s.inputError]}
              />
              <Pressable
                onPress={() => step(hoursText, setHoursText, 1, 0, MAX_HOURS)}
                disabled={locked}
                style={[s.stepButtonSm, locked && s.stepDisabled]}>
                <Plus color={locked ? colors.textFaint : colors.text} size={14} />
              </Pressable>
            </View>
          </View>

          <View style={s.dualCol}>
            <Text style={s.dualLabel}>Minutes</Text>
            <View style={s.stepper}>
              <Pressable
                onPress={() => step(minsText, setMinsText, -5, 0, MAX_MINUTES)}
                disabled={locked}
                style={[s.stepButtonSm, locked && s.stepDisabled]}>
                <Minus color={locked ? colors.textFaint : colors.text} size={14} />
              </Pressable>
                <TextInput
                value={minsText}
                onChangeText={onMinsChange}
                onBlur={() => blur(minsText, setMinsText, 0)}
                keyboardType="number-pad"
                editable={!locked}
                selectTextOnFocus
                style={[s.dualInput, minutes > MAX_MINUTES && s.inputError]}
              />
              <Pressable
                onPress={() => step(minsText, setMinsText, 5, 0, MAX_MINUTES)}
                disabled={locked}
                style={[s.stepButtonSm, locked && s.stepDisabled]}>
                <Plus color={locked ? colors.textFaint : colors.text} size={14} />
              </Pressable>
            </View>
          </View>
        </View>

        {lockError ? (
          <Text style={s.errorText}>{lockError}</Text>
        ) : (
          <Text style={s.helperText}>{`Up to ${MAX_HOURS}h ${MAX_MINUTES}m`}</Text>
        )}
      </Card>

            {!locked && (
        <View style={s.presetBlock}>
          <Text style={s.presetHead}>Quick presets</Text>
          {PRESETS.map(p => {
            const active =
              p.allowance === allowance && p.lockH === hours && p.lockM === minutes;
            const cycle = p.allowance * 60 + joinDuration(p.lockH, p.lockM);
            return (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                style={[s.presetCard, active && s.presetCardActive]}>
                <View style={s.presetBody}>
                  <Text style={[s.presetTitle, active && s.presetTitleActive]}>
                    {p.label}
                  </Text>
                  <Text style={[s.presetMeta, active && s.presetMetaActive]}>
                    {`${formatDuration(p.allowance * 60)} use · ${formatDuration(
                      joinDuration(p.lockH, p.lockM),
                    )} lock`}
                  </Text>
                </View>
                <Text style={[s.presetCycle, active && s.presetMetaActive]}>
                  {formatDuration(cycle)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={onSave}
        disabled={!canSave}
        style={[s.saveButton, !canSave && s.saveDisabled]}>
        <Text style={s.saveText}>{existing ? 'Update limit' : 'Set limit'}</Text>
      </Pressable>

      {existing && !locked && (
        <>
          {existing.isActive ? (
            <Pressable onPress={() => setDialog('disable')} style={s.secondaryButton}>
              <Text style={s.secondaryText}>Disable limit</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setDialog('enable')} style={s.secondaryButton}>
              <Text style={s.secondaryTextPrimary}>Enable limit</Text>
            </Pressable>
          )}
           <Pressable onPress={() => setDialog('remove')} style={s.removeButton}>
            <Text style={s.removeText}>Remove permanently</Text>
          </Pressable>
        </>
      )}

       <ConfirmModal
        visible={dialog === 'disable'}
        tone="blocked"
        icon={<PauseCircle color={colors.blocked} size={22} />}
        title="Pause this limit?"
        body={`${appLabel} moves to Paused. Your settings are kept, and nothing will be blocked until you turn it back on.`}
        confirmLabel="Pause"
        onConfirm={runDisable}
        onCancel={() => setDialog(null)}
      />

      <ConfirmModal
        visible={dialog === 'enable'}
        tone="primary"
        icon={<Play color={colors.primary} size={22} />}
        title="Enable this limit?"
        body={`${appLabel} will be limited to ${formatDuration(
          allowance * 60,
        )}, then locked for ${formatDuration(lockSeconds)}.`}
        confirmLabel="Enable"
        onConfirm={runEnable}
        onCancel={() => setDialog(null)}
      />

      <ConfirmModal
        visible={dialog === 'remove'}
        tone="danger"
        icon={<Trash2 color={colors.danger} size={22} />}
        title="Remove limit permanently?"
        body={`This deletes the limit for ${appLabel}, including its settings. This can't be undone.`}
        confirmLabel="Remove"
        onConfirm={runRemove}
        onCancel={() => setDialog(null)}
      />

    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

    appCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    appMeta: { flex: 1, gap: 2 },
    appName: { ...typeScale.heading, color: c.text },
    appPackage: { ...typeScale.micro, color: c.textFaint },

    noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    lockedText: { flex: 1, ...typeScale.caption, color: c.blockedDeep, lineHeight: 20 },

    explainer: { ...typeScale.body, color: c.primaryDeep, lineHeight: 22 },
    explainerMeta: {
      ...typeScale.micro,
      color: c.primaryDeep,
      marginTop: spacing.sm,
      opacity: 0.75,
    },

    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepButton: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonSm: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDisabled: { opacity: 0.4 },
    stepperValue: { alignItems: 'center', flex: 1 },
    stepperInput: {
      fontSize: 34,
      fontWeight: '600',
      color: c.text,
      padding: 0,
      textAlign: 'center',
      minWidth: 90,
    },
    inputError: { color: c.danger },
    stepperUnit: { ...typeScale.micro, color: c.textFaint },

    dualRow: { flexDirection: 'row', gap: spacing.lg },
    dualCol: { flex: 1, gap: spacing.sm },
    dualLabel: { ...typeScale.micro, color: c.textFaint },
    dualInput: {
      ...typeScale.heading,
      color: c.text,
      padding: 0,
      minWidth: 44,
      textAlign: 'center',
    },

    helperText: { ...typeScale.micro, color: c.textFaint, marginTop: spacing.sm },
    errorText: { ...typeScale.micro, color: c.danger, marginTop: spacing.sm },

        presetBlock: { gap: spacing.sm, marginTop: spacing.xs },
    presetHead: {
      ...typeScale.micro,
      color: c.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.xs,
    },
    presetCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    presetCardActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    presetBody: { flex: 1, gap: 2 },
    presetTitle: { ...typeScale.body, color: c.text },
    presetTitleActive: { color: c.primaryDeep, fontWeight: '600' },
    presetMeta: { ...typeScale.micro, color: c.textFaint },
    presetMetaActive: { color: c.primaryDeep },
    presetCycle: {
      ...typeScale.caption,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    saveButton: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      borderRadius: radius.md,
      marginTop: spacing.sm,
    },
    saveDisabled: { backgroundColor: c.disabled },
    saveText: { ...typeScale.bodyStrong, color: c.primaryOn, textAlign: 'center' },

    secondaryButton: {
      padding: spacing.md + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    secondaryText: { ...typeScale.body, color: c.text, textAlign: 'center' },
    secondaryTextPrimary: {
      ...typeScale.bodyStrong,
      color: c.primary,
      textAlign: 'center',
    },

    removeButton: { padding: spacing.md },
    removeText: { ...typeScale.micro, color: c.danger, textAlign: 'center' },
  });
}