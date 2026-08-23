import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLimitsStore } from '../../store/limitsStore';
import { isLocked } from '../../db/limitsRepo';
import { formatDuration, formatCountdown } from '../../utils/time';
import AppIcon from '../../components/AppIcon';

export default function AppListScreen() {
  const nav = useNavigation<any>();
  const { limits, load, toggle } = useLimitsStore();

  useEffect(() => {
    load();
    const unsub = nav.addListener('focus', load);
    return unsub;
  }, [nav, load]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={limits}
        keyExtractor={i => i.packageName}
        ListHeaderComponent={
          <View style={{ padding: 24, paddingBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '600', color: '#2C2C2A' }}>
              Mga limit
            </Text>
            <Text style={{ fontSize: 14, color: '#6B6B66', marginTop: 4 }}>
              {limits.length} apps ang naka-set
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const locked = isLocked(item);
          return (
            <Pressable
              onPress={() =>
                nav.navigate('LimitEditor', {
                  packageName: item.packageName,
                  appLabel: item.appLabel,
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 14,
                gap: 14,
              }}>
              <AppIcon packageName={item.packageName} />

              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, color: '#2C2C2A' }}>
                  {item.appLabel}
                </Text>
                <Text style={{ fontSize: 13, color: '#6B6B66', marginTop: 2 }}>
                  {`${formatDuration(item.allowanceSeconds)} kada ${formatDuration(
                    item.lockSeconds + item.allowanceSeconds,
                  )}`}
                </Text>
                {locked && (
                  <Text style={{ fontSize: 13, color: '#D85A30', marginTop: 2 }}>
                    Naka-lock · {formatCountdown(item.lockedUntil! - Date.now())}
                  </Text>
                )}
              </View>

              <Switch
                value={item.isActive}
                onValueChange={v => toggle(item.packageName, v)}
                disabled={locked}
                trackColor={{ true: '#1D9E75' }}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: '#9C9A92', lineHeight: 22 }}>
              Wala pang naka-set na limit. Pindutin ang + para magdagdag.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => nav.navigate('AppPicker')}
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#1D9E75',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: '#FFF', fontSize: 28, lineHeight: 32 }}>+</Text>
      </Pressable>
    </View>
  );
}