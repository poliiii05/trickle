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
import { useLimitsStore } from '../../store/limitsStore';
import { isLocked } from '../../db/limitsRepo';
import { splitDuration, joinDuration, formatCountdown } from '../../utils/time';
import AppIcon from '../../components/AppIcon';
import {
  useTheme,
  spacing,
  radius,
  iconSize,
  type as typeScale,
  type Palette,
} from '../../theme';

const PRESETS = [
  { label: '20m per day', allowance: 20, lockH: 23, lockM: 40 },
  { label: '1h per day', allowance: 60, lockH: 23, lockM: 0 },
  { label: '20m then 10m break', allowance: 20, lockH: 0, lockM: 10 },
  { label: '45m then 2h break', allowance: 45, lockH: 2, lockM: 0 },
];

export default function LimitEditorScreen() {
  const nav = useNavigation<any>();
  const { packageName, appLabel } = useRoute<any>().params;
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const { byPackage, save, remove, load } = useLimitsStore();

  const existing = byPackage(packageName);
  const locked = existing ? isLocked(existing) : false;

  const [allowanceMin, setAllowanceMin] = useState('20');
  const [lockHours, setLockHours] = useState('23');
  const [lockMins, setLockMins] = useState('40');

  useEffect(() => {
    if (!existing) return;
    setAllowanceMin(String(Math.round(existing.allowanceSeconds / 60)));
    const { hours, minutes } = splitDuration(existing.lockSeconds);
    setLockHours(String(hours));
    setLockMins(String(minutes));
  }, [existing]);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setAllowanceMin(String(p.allowance));
    setLockHours(String(p.lockH));
    setLockMins(String(p.lockM));
  };

  const onSave = async () => {
    const allowance = parseInt(allowanceMin, 10);
    const h = parseInt(lockHours, 10) || 0;
    const m = parseInt(lockMins, 10) || 0;

    if (!allowance || allowance < 1) {
      Alert.alert('Invalid allowance', 'Must be at least 1 minute.');
      return;
    }
    if (h === 0 && m === 0) {
      Alert.alert('Invalid lock', 'Lock must be at least 1 minute.');
      return;
    }

    await save({
      packageName,
      appLabel,
      allowanceSeconds: allowance * 60,
      lockSeconds: joinDuration(h, m),
    });
    nav.goBack();
  };

  const onDelete = () => {
    Alert.alert('Remove limit?', `This will remove the limit for ${appLabel}.`, [
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
    ]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.head}>
        <AppIcon packageName={packageName} size={iconSize.lg} />
        <Text style={s.appName}>{appLabel}</Text>
      </View>

      {locked && (
        <View style={s.lockedBanner}>
          <Text style={s.lockedText}>
            {`This app is currently locked. You can change its settings in ${formatCountdown(
              existing!.lockedUntil! - Date.now(),
            )}.`}
          </Text>
        </View>
      )}

      <View style={s.field}>
        <Text style={s.fieldLabel}>Screen time (minutes)</Text>
        <TextInput
          value={allowanceMin}
          onChangeText={setAllowanceMin}
          keyboardType="number-pad"
          editable={!locked}
          style={[s.input, locked && s.inputDisabled]}
        />
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Lock duration after limit</Text>
        <View style={s.durationRow}>
          <View style={s.durationCol}>
            <Text style={s.microLabel}>Hours</Text>
            <TextInput
              value={lockHours}
              onChangeText={setLockHours}
              keyboardType="number-pad"
              editable={!locked}
              style={[s.input, locked && s.inputDisabled]}
            />
          </View>
          <View style={s.durationCol}>
            <Text style={s.microLabel}>Minutes</Text>
            <TextInput
              value={lockMins}
              onChangeText={setLockMins}
              keyboardType="number-pad"
              editable={!locked}
              style={[s.input, locked && s.inputDisabled]}
            />
          </View>
        </View>
      </View>

      {!locked && (
        <View style={s.field}>
          <Text style={s.fieldLabel}>Quick presets</Text>
          <View style={s.presetWrap}>
            {PRESETS.map(p => (
              <Pressable key={p.label} onPress={() => applyPreset(p)} style={s.preset}>
                <Text style={s.presetText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={onSave}
        disabled={locked}
        style={[s.saveButton, locked && s.saveButtonDisabled]}>
        <Text style={s.saveText}>Save</Text>
      </Pressable>

      {existing && !locked && (
        <Pressable onPress={onDelete} style={s.removeButton}>
          <Text style={s.removeText}>Remove limit</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.xl, gap: spacing.xl },

    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2 },
    appName: { ...typeScale.heading, color: c.text, flex: 1 },

    lockedBanner: {
      backgroundColor: c.blockedSoft,
      padding: spacing.lg,
      borderRadius: radius.md,
    },
    lockedText: { ...typeScale.body, color: c.blockedDeep, lineHeight: 22 },

    field: { gap: spacing.sm },
    fieldLabel: { ...typeScale.label, color: c.textMuted },
    microLabel: { ...typeScale.micro, color: c.textFaint },

    input: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      fontSize: 18,
      color: c.text,
    },
    inputDisabled: { backgroundColor: c.surfaceAlt, color: c.textFaint },

    durationRow: { flexDirection: 'row', gap: spacing.md },
    durationCol: { flex: 1, gap: spacing.xs + 2 },

    presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    preset: {
      paddingHorizontal: spacing.md + 2,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
    },
    presetText: { ...typeScale.caption, color: c.text },

    saveButton: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      borderRadius: radius.md,
    },
    saveButtonDisabled: { backgroundColor: c.disabled },
    saveText: { ...typeScale.bodyStrong, color: c.primaryOn, textAlign: 'center' },

    removeButton: { padding: spacing.md },
    removeText: { ...typeScale.body, color: c.danger, textAlign: 'center' },
  });
}