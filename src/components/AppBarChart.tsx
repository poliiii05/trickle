import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { formatDuration } from '../utils/time';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../theme';

export interface AppBarDatum {
  packageName: string;
  appLabel: string;
  total: number;
}

export default function AppBarChart({
  data,
  max,
}: {
  data: AppBarDatum[];
  max?: number;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const ceiling = max ?? Math.max(1, ...data.map(d => d.total));

  return (
    <View style={s.root}>
      {data.map(d => {
        const ratio = Math.max(0.02, d.total / ceiling);
        

        return (
          <View key={d.packageName} style={s.row}>
            <AppIcon packageName={d.packageName} size={26} />

            <View style={s.body}>
              <View style={s.labelRow}>
                <Text numberOfLines={1} style={s.label}>
                  {d.appLabel}
                </Text>
                 <Text style={s.value}>{formatDuration(d.total)}</Text>
              </View>

              <View style={s.track}>
                                <View
                  style={[
                    s.fill,
                    { width: `${ratio * 100}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    body: { flex: 1, gap: spacing.xs + 2 },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    label: { flex: 1, ...typeScale.caption, color: c.text },
    value: {
      ...typeScale.micro,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    valueLead: { color: c.accentDeep, fontWeight: '700' },
    track: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill },
  });
}