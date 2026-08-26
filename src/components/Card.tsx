import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

export default function Card({
  label,
  children,
  style,
  tone = 'surface',
}: {
  label?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  tone?: 'surface' | 'primary' | 'blocked';
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[s.card, s[tone], style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
    },
    surface: { backgroundColor: c.surface, borderColor: c.border },
    primary: { backgroundColor: c.primarySoft, borderColor: c.primarySoft },
    blocked: { backgroundColor: c.blockedSoft, borderColor: c.blockedSoft },
    label: {
      ...typeScale.micro,
      color: c.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
  });
}