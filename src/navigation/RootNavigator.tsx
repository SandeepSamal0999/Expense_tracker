import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { COLORS } from '../constants/colors';

export default function RootNavigator() {
  const { state } = useApp();

  if (!state.isAuthChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return state.user ? <MainTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
