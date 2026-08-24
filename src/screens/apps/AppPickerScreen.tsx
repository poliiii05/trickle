import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Apps from '../../native/Apps';
import type { InstalledApp } from '../../native/types';
import { useLimitsStore } from '../../store/limitsStore';
import AppIcon from '../../components/AppIcon';

const PROTECTED_HINTS = [
    'com.android.settings',
    'com.android.dialer',
    'com.google.android.dialer',
    'com.android.contacts',
    'com.google.android.apps.messaging',
  ];

export default function AppPickerScreen() {
  const nav = useNavigation<any>();
  const limits = useLimitsStore(s => s.limits);
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
    [limits]
  );

   
  const filtered = useMemo(() => {
    const base = apps.filter(a => !PROTECTED_HINTS.includes(a.packageName));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(a => a.appLabel.toLowerCase().includes(q));
  }, [apps, search]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <TextInput
          placeholder="Search apps"
          placeholderTextColor="#9C9A92"
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: '#FFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: '#2C2C2A',
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#1D9E75" style={{ marginTop: 32 }} />
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  gap: 14,
                  opacity: already ? 0.4 : 1,
                }}>
                <AppIcon packageName={item.packageName} />
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 16, color: '#2C2C2A' }}>
                  {item.appLabel}
                </Text>
                {already && (
                  <Text style={{ fontSize: 13, color: '#9C9A92' }}>Already set</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}