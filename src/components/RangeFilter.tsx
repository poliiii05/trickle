import React, { useMemo } from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { RANGE_OPTIONS, type RangeId } from '../utils/ranges';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

export default function RangeFilter({
  value,
  onChange,
}: {
  value: RangeId;
  onChange: (id: RangeId) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}>
      {RANGE_OPTIONS.map(opt => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[s.pill, active ? s.pillActive : s.pillIdle]}>
            <Text style={[s.text, active ? s.textActive : s.textIdle]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    row: { gap: spacing.sm, paddingRight: spacing.lg },
    pill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    pillActive: { backgroundColor: c.primary, borderColor: c.primary },
    pillIdle: { backgroundColor: c.surface, borderColor: c.border },
    text: { ...typeScale.caption, fontWeight: '600' },
    textActive: { color: c.primaryOn },
    textIdle: { color: c.textMuted },
  });
}