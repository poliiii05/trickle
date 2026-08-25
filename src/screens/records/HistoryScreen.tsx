import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { getDailyTotals, getTopApps, exportUsageCsv } from '../../db/usageRepo';
import { runSync } from '../../services/syncService';
import { formatDuration } from '../../utils/time';
import Files from '../../native/Files';
import AppIcon from '../../components/AppIcon';

export default function HistoryScreen() {
  const [range, setRange] = useState<7 | 30>(7);
  const [daily, setDaily] = useState<{ day: string; total: number }[]>([]);
  const [top, setTop] = useState<{ packageName: string; total: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      await runSync();
      setDaily(await getDailyTotals(range));
      setTop(await getTopApps(range));
    } finally {
      setBusy(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const bars = daily.map(d => ({
    value: Math.round(d.total / 60),
    label: d.day.slice(5).replace('-', '/'),
    frontColor: '#1D9E75',
  }));

  const onExport = async () => {
    try {
      const csv = await exportUsageCsv();
      await Files.shareCsv(`trickle-${Date.now()}.csv`, csv);
    } catch (e) {
      Alert.alert('Nabigo ang export', String(e));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 24 }}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor="#1D9E75" />}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([7, 30] as const).map(r => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: range === r ? '#1D9E75' : '#EFEEE9',
            }}>
            <Text style={{ color: range === r ? '#FFF' : '#2C2C2A', fontSize: 14 }}>
              {r} araw
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16 }}>
        <Text style={{ fontSize: 14, color: '#6B6B66', marginBottom: 12 }}>
          Screen time kada araw (minuto)
        </Text>
        {bars.length > 0 ? (
          <BarChart
            data={bars}
            barWidth={range === 7 ? 24 : 8}
            spacing={range === 7 ? 16 : 4}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisLabelTextStyle={{ fontSize: 9, color: '#9C9A92' }}
            yAxisTextStyle={{ fontSize: 10, color: '#9C9A92' }}
            hideRules
          />
        ) : (
          <Text style={{ color: '#9C9A92' }}>Wala pang data.</Text>
        )}
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 14, color: '#6B6B66', marginBottom: 8 }}>
          Pinakamadalas gamitin
        </Text>
        {top.map(t => (
          <View
            key={t.packageName}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
            <AppIcon packageName={t.packageName} size={32} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: '#2C2C2A' }}>
              {t.packageName}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B6B66' }}>
              {formatDuration(t.total)}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onExport}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#EFEEE9' }}>
        <Text style={{ textAlign: 'center', color: '#2C2C2A' }}>I-export bilang CSV</Text>
      </Pressable>
    </ScrollView>
  );
}