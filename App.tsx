import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useAutoCapture } from './src/hooks/useAutoCapture';

// Runs inside AppProvider so it can access context state.
// Keeps SMS/notification listeners alive regardless of active tab.
function AutoCaptureRunner() {
  const { state, addExpense } = useApp();
  const { smsEnabled, notifEnabled } = state.settings;
  useAutoCapture(smsEnabled, notifEnabled, addExpense);
  return null;
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B0F" />
      <AppProvider>
        <AutoCaptureRunner />
        <RootNavigator />
      </AppProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0F',
  },
});
