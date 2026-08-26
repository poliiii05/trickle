import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Minus, Plus, Lock, AlertCircle } from 'lucide-react-native';
import { useLimitsStore } from '../../store/limitsStore';
import { isLocked } from '../../db/limitsRepo';
import { splitDuration, joinDuration, formatCountdown, formatDuration } from '../../utils/time';
import AppIcon from '../../components/AppIcon';
import Card from '../../components/Card';
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
      ? null
      : allowance < 1
      ? 'Must be at least 1 minute.'
      : allowance > MAX_ALLOWANCE
      ? `Cannot exceed ${MAX_ALLOWANCE} minutes (24 hours).`
      : null;

  const lockError =
    hours === 0 && minutes === 0 ? 'Lock must be at least 1 minute.' : null;

  const canSave =
    !locked &&
    allowanceText !== '' &&
    !allowanceError &&
    !lockError;

  // --- Editing ---
  const onAllowanceChange = (text: string) => {
    const clean = sanitize(text);
    if (clean !== '' && toInt(clean) > MAX_ALLOWANCE) return;   // block the keystroke
    setAllowanceText(clean);
  };

  const onHoursChange = (text: string) => {
    const clean = sanitize(text);
    if (clean !== '' && toInt(clean) > MAX_HOURS) return;
    setHoursText(clean);
    // 23h is the ceiling — minutes can never push past 23:59
    if (toInt(clean) === MAX_HOURS && minutes > MAX_MINUTES) {
      setMinsText(String(MAX_MINUTES));
    }
  };

  const onMinsChange = (text: string) => {
    const clean = sanitize(text);
    if (clean !== '' && toInt(clean) > MAX_MINUTES) return;
    setMinsText(clean);
  };

  const blur = (
    text: string,
    setter: (v: string) => void,
    fallback: number,
    max: number,
  ) => {
    if (text === '') {
      setter(String(fallback));
      return;
    }
    const n = Math.min(max, toInt(text));
    setter(String(n));
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
    await save({
      packageName,
      appLabel,
      allowanceSeconds: allowance * 60,
      lockSeconds,
    });
    nav.goBack();
  };

  const onDisable = () => {
    Alert.alert(
      'Disable this limit?',
      `${appLabel} will move to Paused. Your settings are kept, and nothing will be blocked until you turn it back on.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          onPress: async () => {
            await toggle(packageName, false);
            nav.goBack();
          },
        },
      ],
    );
  };

  const onEnable = () => {
    Alert.alert(
      'Enable this limit?',
      `${appLabel} will be limited to ${formatDuration(
        allowance * 60,
      )}, then locked for ${formatDuration(lockSeconds)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            await toggle(packageName, true);
            nav.goBack();
          },
        },
      ],
    );
  };

  const onRemove = () => {
    Alert.alert(
      'Remove limit permanently?',
      `This deletes the limit for ${appLabel}, including its settings. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await remove(packageName);
            await load();
            nav.goBack();
          },
        },
      ],
    );
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
              onBlur={() => blur(allowanceText, setAllowanceText, 20, MAX_ALLOWANCE)}
              keyboardType="number-pad"
              maxLength={4}
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
                onBlur={() => blur(hoursText, setHoursText, 0, MAX_HOURS)}
                keyboardType="number-pad"
                maxLength={2}
                editable={!locked}
                selectTextOnFocus
                style={s.dualInput}
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
                onBlur={() => blur(minsText, setMinsText, 0, MAX_MINUTES)}
                keyboardType="number-pad"
                maxLength={2}
                editable={!locked}
                selectTextOnFocus
                style={s.dualInput}
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
          <Text style={s.presetHead}>Presets</Text>
          <View style={s.presetWrap}>
            {PRESETS.map(p => {
              const active =
                p.allowance === allowance &&
                p.lockH === hours &&
                p.lockM === minutes;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => applyPreset(p)}
                  style={[s.preset, active && s.presetActive]}>
                  <Text style={[s.presetText, active && s.presetTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
            <Pressable onPress={onDisable} style={s.secondaryButton}>
              <Text style={s.secondaryText}>Disable limit</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onEnable} style={s.secondaryButton}>
              <Text style={s.secondaryTextPrimary}>Enable limit</Text>
            </Pressable>
          )}

          <Pressable onPress={onRemove} style={s.removeButton}>
            <Text style={s.removeText}>Remove permanently</Text>
          </Pressable>
        </>
      )}
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
    },
    presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    preset: {
      paddingHorizontal: spacing.md + 2,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    presetActive: { backgroundColor: c.primary, borderColor: c.primary },
    presetText: { ...typeScale.caption, color: c.text },
    presetTextActive: { color: c.primaryOn, fontWeight: '600' },

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