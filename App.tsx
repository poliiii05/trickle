import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View, Button } from 'react-native';
import Trickle from './src/native/Trickle';

export default function App() {
  const [pong, setPong] = useState<string>('...');
  const [sdk, setSdk] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const test = async () => {
    try {
      setError(null);
      setPong(await Trickle.ping());
      setSdk(await Trickle.getAndroidVersion());
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    test();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF8' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '600', color: '#2C2C2A' }}>
          Trickle
        </Text>

        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, gap: 8 }}>
          <Text style={{ color: '#6B6B66' }}>Native ping</Text>
          <Text style={{ fontSize: 18, color: '#2C2C2A' }}>{pong}</Text>
        </View>

        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, gap: 8 }}>
          <Text style={{ color: '#6B6B66' }}>Android SDK level</Text>
          <Text style={{ fontSize: 18, color: '#2C2C2A' }}>{sdk ?? '...'}</Text>
        </View>

        {error && (
          <View style={{ backgroundColor: '#FCEBEB', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#A32D2D' }}>{error}</Text>
          </View>
        )}

        <Button title="Test ulit" onPress={test} />
      </ScrollView>
    </SafeAreaView>
  );
}