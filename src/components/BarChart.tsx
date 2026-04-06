import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  barColor?: string;
  height?: number;
}

export default function BarChart({ data, barColor = COLORS.accent, height = 140 }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsRow}>
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * (height - 30);
          return (
            <View key={index} style={styles.barWrap}>
              <View style={[styles.barOuter, { height: height - 30 }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
  },
  barOuter: {
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '50%',
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },
});
