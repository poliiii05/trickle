import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BarChart3, ShieldCheck } from 'lucide-react-native';
import HistoryScreen from './HistoryScreen';
import InsightsScreen from './InsightsScreen';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../../theme';

type Segment = 'usage' | 'blocks';

export default function StatsScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [segment, setSegment] = useState<Segment>('usage');

  return (
    <View style={s.root}>
      <View style={s.segmented}>
        <Pressable
          onPress={() => setSegment('usage')}
          style={[s.segment, segment === 'usage' && s.segmentActive]}>
          <BarChart3
            color={segment === 'usage' ? colors.primaryOn : colors.textMuted}
            size={15}
          />
          <Text
            style={[s.segmentText, segment === 'usage' && s.segmentTextActive]}>
            Usage
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSegment('blocks')}
          style={[s.segment, segment === 'blocks' && s.segmentActive]}>
          <ShieldCheck
            color={segment === 'blocks' ? colors.primaryOn : colors.textMuted}
            size={15}
          />
          <Text
            style={[s.segmentText, segment === 'blocks' && s.segmentTextActive]}>
            Blocks
          </Text>
        </Pressable>
      </View>

      {segment === 'usage' ? <HistoryScreen /> : <InsightsScreen />}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    segmented: {
      flexDirection: 'row',
      gap: spacing.xs,
      margin: spacing.lg,
      marginBottom: 0,
      padding: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
    },
    segmentActive: { backgroundColor: c.primary },
    segmentText: { ...typeScale.caption, fontWeight: '600', color: c.textMuted },
    segmentTextActive: { color: c.primaryOn },
  });
}