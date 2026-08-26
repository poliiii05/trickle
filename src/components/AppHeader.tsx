import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiveLimits } from '../hooks/useLiveLimits';
import TrickleMark from './TrickleMark';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

export default function AppHeader() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const live = useLiveLimits(5000);
  const lockedCount = useMemo(
    () => live.filter(l => l.lockedUntil > Date.now()).length,
    [live],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.brand}>
        <TrickleMark size={22} />
        <Text style={s.wordmark}>Trickle</Text>
      </View>

      {lockedCount > 0 ? (
        <View style={s.badge}>
          <View style={s.dot} />
          <Text style={s.badgeText}>
            {`${lockedCount} locked`}
          </Text>
        </View>
      ) : (
        <View style={s.badgeIdle}>
          <Text style={s.badgeIdleText}>Active</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    wordmark: {
      ...typeScale.bodyStrong,
      color: c.text,
      letterSpacing: 0.2,
    },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: c.blockedSoft,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.blocked },
    badgeText: { ...typeScale.micro, color: c.blockedDeep, fontWeight: '600' },

    badgeIdle: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: c.primarySoft,
    },
    badgeIdleText: { ...typeScale.micro, color: c.primaryDeep, fontWeight: '600' },
  });
}