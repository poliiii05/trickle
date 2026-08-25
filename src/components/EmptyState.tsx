import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

export default function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={s.root}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={s.button}>
          <Text style={s.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
      alignItems: 'center',
      gap: spacing.md,
    },
    title: { ...typeScale.heading, color: c.text, textAlign: 'center' },
    body: {
      ...typeScale.body,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    button: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
    },
    buttonText: { ...typeScale.bodyStrong, color: c.primaryOn },
  });
}