import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
}

export default function MetricCard({ label, value, subtitle, accentColor }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accentColor ? { color: accentColor } : null]}>
        {value}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
