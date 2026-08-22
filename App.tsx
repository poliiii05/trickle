import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import TodayScreen from './src/screens/home/TodayScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF8' }}>
      <StatusBar barStyle="dark-content" />
      <TodayScreen />
    </SafeAreaView>
  );
}