import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, type Palette } from '../theme';

export default function ProgressBar({
  progress,
  tone = 'primary',
  height = 6,
}: {
  progress: number;
  tone?: 'primary' | 'accent' | 'warning' | 'blocked';
  height?: number;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const clamped = Math.max(0, Math.min(1, progress));
  const fillColor =
    tone === 'blocked'
      ? colors.blocked
      : tone === 'warning'
      ? colors.warning
      : tone === 'accent'
      ? colors.accent
      : colors.primary;

  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          s.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    track: { width: '100%', backgroundColor: c.surfaceAlt, overflow: 'hidden' },
    fill: { height: '100%' },
  });
}