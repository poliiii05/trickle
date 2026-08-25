import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  AppState,
  StyleSheet,
} from 'react-native';
import Tracking from '../../native/Tracking';
import Permissions from '../../native/Permissions';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../../theme';

interface Step {
  key: string;
  title: string;
  body: string;
  required: boolean;
  open: () => void;
}

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [usage, setUsage] = useState(false);
  const [a11y, setA11y] = useState(false);
  const [battery, setBattery] = useState(false);
  const appState = useRef(AppState.currentState);

  const refresh = useCallback(async () => {
    const perms = await Permissions.getPermissionStatus();
    setUsage(perms.usageStats);
    setBattery(perms.batteryExempt);
    setA11y(await Tracking.isAccessibilityEnabled());
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', next => {
      if (appState.current?.match(/inactive|background/) && next === 'active') {
        refresh();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refresh]);

  const steps: Step[] = [
    {
      key: 'usage',
      title: 'Usage access',
      body: 'Lets Trickle measure how long you spend in each app.',
      required: true,
      open: () => Permissions.openUsageAccessSettings(),
    },
    {
      key: 'a11y',
      title: 'Accessibility service',
      body: 'Lets Trickle notice which app is open so it can enforce your limits. It never reads screen content.',
      required: true,
      open: () => Tracking.openAccessibilitySettings(),
    },
    {
      key: 'battery',
      title: 'Ignore battery optimization',
      body: 'Stops the system from killing Trickle in the background. Recommended on Honor, Xiaomi, Oppo, and Vivo devices.',
      required: false,
      open: () => Permissions.openBatteryOptimizationSettings(),
    },
  ];

  const done = { usage, a11y, battery };
  const canContinue = usage && a11y;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.head}>
        <Text style={s.title}>Set up Trickle</Text>
        <Text style={s.intro}>
          Trickle needs a few permissions Android doesn't grant through a normal
          dialog. Each one opens a Settings screen — come back here when you're done.
        </Text>
      </View>

      {steps.map((step, i) => {
        const ok = done[step.key as keyof typeof done];
        return (
          <Pressable key={step.key} onPress={step.open} style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.badge, ok ? s.badgeOk : s.badgeIdle]}>
                <Text style={[s.badgeText, ok ? s.badgeTextOk : s.badgeTextIdle]}>
                  {ok ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text style={s.cardTitle}>{step.title}</Text>
              {!step.required && <Text style={s.optional}>Optional</Text>}
            </View>
            <Text style={s.cardBody}>{step.body}</Text>
            <Text style={s.cardAction}>{ok ? 'Enabled' : 'Open Settings'}</Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onDone}
        disabled={!canContinue}
        style={[s.continueButton, !canContinue && s.continueDisabled]}>
        <Text style={s.continueText}>
          {canContinue ? 'Continue' : 'Enable the two required permissions'}
        </Text>
      </Pressable>

      <Pressable onPress={refresh} style={s.recheck}>
        <Text style={s.recheckText}>Check again</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.xl, gap: spacing.lg },

    head: { gap: spacing.md, marginBottom: spacing.sm },
    title: { ...typeScale.title, color: c.text },
    intro: { ...typeScale.body, color: c.textMuted, lineHeight: 22 },

    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    cardTitle: { ...typeScale.bodyStrong, color: c.text, flex: 1 },
    cardBody: { ...typeScale.caption, color: c.textMuted, lineHeight: 20 },
    cardAction: { ...typeScale.label, color: c.primary, marginTop: spacing.xs },
    optional: { ...typeScale.micro, color: c.textFaint },

    badge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeOk: { backgroundColor: c.primary },
    badgeIdle: { backgroundColor: c.surfaceAlt },
    badgeText: { ...typeScale.caption, fontWeight: '600' },
    badgeTextOk: { color: c.primaryOn },
    badgeTextIdle: { color: c.textMuted },

    continueButton: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      borderRadius: radius.md,
      marginTop: spacing.sm,
    },
    continueDisabled: { backgroundColor: c.disabled },
    continueText: { ...typeScale.bodyStrong, color: c.primaryOn, textAlign: 'center' },

    recheck: { padding: spacing.md },
    recheckText: { ...typeScale.body, color: c.primary, textAlign: 'center' },
  });
}