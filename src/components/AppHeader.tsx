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
  const activeCount = useMemo(
    () => live.filter(l => l.isActive).length,
    [live],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.bar}>
        <View style={s.brand}>
          <View style={s.markWrap}>
            <TrickleMark size={20} />
          </View>
          <View>
            <Text style={s.wordmark}>Trickle</Text>
            <Text style={s.tagline}>
              {activeCount > 0 ? `${activeCount} limits running` : 'No limits yet'}
            </Text>
          </View>
        </View>

                <View
          style={[
            s.badge,
            lockedCount > 0 ? s.badgeLocked : s.badgeIdle,
          ]}>
          <View
            style={[
              s.dot,
              { backgroundColor: lockedCount > 0 ? colors.blocked : colors.primary },
            ]}
          />
          <Text
            style={[
              s.badgeText,
              { color: lockedCount > 0 ? colors.blockedDeep : colors.primaryDeep },
            ]}>
            {`${lockedCount} locked`}
          </Text>
        </View>
      </View>

      <View style={s.accentRule} />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { backgroundColor: c.bgElevated },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },

    brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    markWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmark: { ...typeScale.bodyStrong, color: c.text, letterSpacing: 0.2 },
    tagline: { ...typeScale.micro, color: c.textFaint, marginTop: 1 },

       badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    badgeLocked: { backgroundColor: c.blockedSoft, borderColor: c.blockedBorder },
    badgeIdle: { backgroundColor: c.primarySoft, borderColor: c.primaryBorder },
    dot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { ...typeScale.micro, fontWeight: '600' },

    accentRule: { height: 2, backgroundColor: c.primary, opacity: 0.9 },
  });
}