import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Permissions from '../../native/Permissions';

export default function PermissionGate({ onRecheck }: { onRecheck: () => void }) {
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: '#2C2C2A' }}>
        Kailangan ng usage access
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: '#6B6B66' }}>
        Para masukat ang oras mo sa bawat app, kailangan ng Trickle ng usage
        access. Hindi ito runtime permission — kailangan mong i-on sa Settings.
      </Text>

      <Pressable
        onPress={() => Permissions.openUsageAccessSettings()}
        style={{ backgroundColor: '#1D9E75', padding: 16, borderRadius: 12 }}>
        <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '500' }}>
          Buksan ang Settings
        </Text>
      </Pressable>

      <Pressable onPress={onRecheck} style={{ padding: 12 }}>
        <Text style={{ color: '#1D9E75', textAlign: 'center' }}>
          Na-on ko na — i-check ulit
        </Text>
      </Pressable>

      <Text style={{ fontSize: 13, color: '#9C9A92', lineHeight: 20 }}>
        Sa Settings: hanapin ang "Trickle" sa listahan, tapos i-on ang
        "Permit usage access."
      </Text>
    </View>
  );
}