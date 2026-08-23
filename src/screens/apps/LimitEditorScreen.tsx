import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLimitsStore } from '../../store/limitsStore';
import { isLocked } from '../../db/limitsRepo';
import { splitDuration, joinDuration, formatCountdown } from '../../utils/time';
import AppIcon from '../../components/AppIcon';

const PRESETS = [
  { label: '20m bawat araw', allowance: 20, lockH: 23, lockM: 40 },
  { label: '1h bawat araw', allowance: 60, lockH: 23, lockM: 0 },
  { label: '20m tapos 10m break', allowance: 20, lockH: 0, lockM: 10 },
  { label: '45m tapos 2h break', allowance: 45, lockH: 2, lockM: 0 },
];

export default function LimitEditorScreen() {
  const nav = useNavigation<any>();
  const { packageName, appLabel } = useRoute<any>().params;
  const { byPackage, save, remove, load } = useLimitsStore();

  const existing = byPackage(packageName);
  const locked = existing ? isLocked(existing) : false;

  const [allowanceMin, setAllowanceMin] = useState('20');
  const [lockHours, setLockHours] = useState('23');
  const [lockMins, setLockMins] = useState('40');

  useEffect(() => {
    if (!existing) return;
    setAllowanceMin(String(Math.round(existing.allowanceSeconds / 60)));
    const { hours, minutes } = splitDuration(existing.lockSeconds);
    setLockHours(String(hours));
    setLockMins(String(minutes));
  }, [existing]);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setAllowanceMin(String(p.allowance));
    setLockHours(String(p.lockH));
    setLockMins(String(p.lockM));
  };

  const onSave = async () => {
    const allowance = parseInt(allowanceMin, 10);
    const h = parseInt(lockHours, 10) || 0;
    const m = parseInt(lockMins, 10) || 0;

    if (!allowance || allowance < 1) {
      Alert.alert('Mali ang allowance', 'Dapat hindi bababa sa 1 minuto.');
      return;
    }
    if (h === 0 && m === 0) {
      Alert.alert('Mali ang lock', 'Dapat hindi bababa sa 1 minuto ang lock.');
      return;
    }

    await save({
      packageName,
      appLabel,
      allowanceSeconds: allowance * 60,
      lockSeconds: joinDuration(h, m),
    });
    nav.goBack();
  };

  const onDelete = () => {
    Alert.alert('Tanggalin ang limit?', `Aalisin ang limit para sa ${appLabel}.`, [
      { text: 'Kanselahin', style: 'cancel' },
      {
        text: 'Tanggalin',
        style: 'destructive',
        onPress: async () => {
          await remove(packageName);
          await load();
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <AppIcon packageName={packageName} size={52} />
        <Text style={{ fontSize: 22, fontWeight: '600', color: '#2C2C2A', flex: 1 }}>
          {appLabel}
        </Text>
      </View>

      {locked && (
        <View style={{ backgroundColor: '#FAECE7', padding: 16, borderRadius: 12 }}>
          <Text style={{ color: '#993C1D', lineHeight: 22 }}>
            Naka-lock ngayon ang app na ito. Mababago mo lang ang settings
            pagkatapos ng {formatCountdown(existing!.lockedUntil! - Date.now())}.
          </Text>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 14, color: '#6B6B66' }}>Screen time (minuto)</Text>
        <TextInput
          value={allowanceMin}
          onChangeText={setAllowanceMin}
          keyboardType="number-pad"
          editable={!locked}
          style={inputStyle(locked)}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 14, color: '#6B6B66' }}>
          Lock pagkatapos maubos
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#9C9A92' }}>Oras</Text>
            <TextInput
              value={lockHours}
              onChangeText={setLockHours}
              keyboardType="number-pad"
              editable={!locked}
              style={inputStyle(locked)}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#9C9A92' }}>Minuto</Text>
            <TextInput
              value={lockMins}
              onChangeText={setLockMins}
              keyboardType="number-pad"
              editable={!locked}
              style={inputStyle(locked)}
            />
          </View>
        </View>
      </View>

      {!locked && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#6B6B66' }}>Mabilisang preset</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map(p => (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: '#EFEEE9',
                }}>
                <Text style={{ fontSize: 13, color: '#2C2C2A' }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={onSave}
        disabled={locked}
        style={{
          backgroundColor: locked ? '#C9C7BF' : '#1D9E75',
          padding: 16,
          borderRadius: 12,
        }}>
        <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '500' }}>
          I-save
        </Text>
      </Pressable>

      {existing && !locked && (
        <Pressable onPress={onDelete} style={{ padding: 12 }}>
          <Text style={{ color: '#A32D2D', textAlign: 'center' }}>
            Tanggalin ang limit
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function inputStyle(disabled: boolean) {
  return {
    backgroundColor: disabled ? '#F3F2EE' : '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: disabled ? '#9C9A92' : '#2C2C2A',
  };
}