import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Apps from '../../native/Apps';
import type { InstalledApp } from '../../native/types';
import { useLimitsStore } from '../../store/limitsStore';
import AppIcon from '../../components/AppIcon';
import {
  useTheme,
  spacing,
  radius,
  type as typeScale,
  type Palette,
} from '../../theme';

const PROTECTED_HINTS = [
  'com.android.settings',
  'com.android.dialer',
  'com.google.android.dialer',
  'com.android.contacts',
  'com.google.android.apps.messaging',
];

export default function AppPickerScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const limits = useLimitsStore(st => st.limits);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Apps.getInstalledApps()
      .then(list => {
        list.sort((a, b) => a.appLabel.localeCompare(b.appLabel));
        setApps(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const existing = useMemo(
    () => new Set(limits.map(l => l.packageName)),
    [limits],
  );

  const filtered = useMemo(() => {
    const base = apps.filter(a => !PROTECTED_HINTS.includes(a.packageName));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(a => a.appLabel.toLowerCase().includes(q));
  }, [apps, search]);

  return (
    <View style={s.root}>
      <View style={s.searchWrap}>
        <TextInput
          placeholder="Search apps"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
          style={s.search}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={s.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.packageName}
          initialNumToRender={12}
          windowSize={7}
          renderItem={({ item }) => {
            const already = existing.has(item.packageName);
            return (
              <Pressable
                disabled={already}
                onPress={() =>
                  nav.replace('LimitEditor', {
                    packageName: item.packageName,
                    appLabel: item.appLabel,
                  })
                }
                style={[s.row, already && s.rowDisabled]}>
                <AppIcon packageName={item.packageName} />
                <Text numberOfLines={1} style={s.rowLabel}>
                  {item.appLabel}
                </Text>
                {already && <Text style={s.rowNote}>Already set</Text>}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },

    searchWrap: { padding: spacing.lg },
    search: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...typeScale.body,
      color: c.text,
    },

    loader: { marginTop: spacing.xxl },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md + 2,
    },
    rowDisabled: { opacity: 0.4 },
    rowLabel: { flex: 1, ...typeScale.body, color: c.text },
    rowNote: { ...typeScale.caption, color: c.textFaint },
  });
}