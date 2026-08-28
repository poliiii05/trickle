import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { formatDuration } from '../utils/time';
import { chartScale } from '../utils/chartScale';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../theme';

export interface TopAppDatum {
  packageName: string;
  appLabel: string;
  total: number;
}

const CHART_HEIGHT = 140;

export default function TopAppsChart({
  data,
  bucket = 'week',
}: {
  data: TopAppDatum[];
  bucket?: 'day' | 'week' | 'month';
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const shown = data.slice(0, 5);
  const peakMinutes = Math.max(0, ...shown.map(d => Math.round(d.total / 60)));
  const { max } = chartScale(peakMinutes, bucket);

  return (
    <View style={s.root}>
      <View style={s.plot}>
        {shown.map(d => {
          const minutes = Math.round(d.total / 60);
          const height = Math.max(5, (minutes / max) * CHART_HEIGHT);
          

          return (
            <View key={d.packageName} style={s.column}>
              <Text style={s.value}>{formatDuration(d.total)}</Text>

              <View style={s.barTrack}>
                <View
                  style={[s.bar, { height, backgroundColor: colors.primary }]}
                />
              </View>

              <AppIcon packageName={d.packageName} size={26} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { gap: spacing.sm },
    plot: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
    },
    column: { alignItems: 'center', gap: spacing.sm, flex: 1 },
    value: {
      ...typeScale.micro,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
    bar: {
      width: 26,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
    },
  });
}