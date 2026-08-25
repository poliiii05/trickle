import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { getBlockStats } from '../../db/blockRepo';
import AppIcon from '../../components/AppIcon';

export default function InsightsScreen() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getBlockStats>> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setStats(await getBlockStats(30));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 24 }}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor="#1D9E75" />}>
      <Text style={{ fontSize: 14, color: '#9C9A92' }}>Huling 30 araw</Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Beses na-block" value={stats?.totalBlocks ?? 0} />
        <Stat label="Tangkang buksan" value={stats?.totalAttempts ?? 0} />
      </View>

      {stats && stats.byApp.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 14, color: '#6B6B66', marginBottom: 8 }}>
            Kada app
          </Text>
          {stats.byApp.map(a => (
            <View
              key={a.packageName}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <AppIcon packageName={a.packageName} size={32} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: '#2C2C2A' }}>
                {a.packageName}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B6B66' }}>
                {a.blocks}× · {a.attempts} tangka
              </Text>
            </View>
          ))}
        </View>
      )}

      {stats && stats.totalBlocks === 0 && (
        <Text style={{ color: '#9C9A92', lineHeight: 22 }}>
          Wala pang na-block sa huling 30 araw.
        </Text>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: '600', color: '#2C2C2A' }}>{value}</Text>
      <Text style={{ fontSize: 13, color: '#6B6B66', marginTop: 4 }}>{label}</Text>
    </View>
  );
}