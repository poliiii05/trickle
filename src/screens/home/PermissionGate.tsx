import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Permissions from '../../native/Permissions';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../../theme';

export default function PermissionGate({ onRecheck }: { onRecheck: () => void }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={s.root}>
      <Text style={s.title}>Usage access required</Text>
      <Text style={s.body}>
        To measure your time in each app, Trickle needs usage access. This isn't a
        runtime permission — you'll need to enable it in Settings.
      </Text>

      <Pressable
        onPress={() => Permissions.openUsageAccessSettings()}
        style={s.primaryButton}>
        <Text style={s.primaryText}>Open Settings</Text>
      </Pressable>

      <Pressable onPress={onRecheck} style={s.secondaryButton}>
        <Text style={s.secondaryText}>I've enabled it — check again</Text>
      </Pressable>

      <Text style={s.hint}>
        In Settings: find "Trickle" in the list, then turn on "Permit usage access."
      </Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, padding: spacing.xl, gap: spacing.lg },
    title: { ...typeScale.heading, color: c.text },
    body: { ...typeScale.body, color: c.textMuted, lineHeight: 22 },
    primaryButton: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      borderRadius: radius.md,
    },
    primaryText: { ...typeScale.bodyStrong, color: c.primaryOn, textAlign: 'center' },
    secondaryButton: { padding: spacing.md },
    secondaryText: { ...typeScale.body, color: c.primary, textAlign: 'center' },
    hint: { ...typeScale.caption, color: c.textFaint, lineHeight: 20 },
  });
}