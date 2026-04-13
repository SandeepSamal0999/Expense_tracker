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

/** Compact rupee label that fits above a narrow bar: ₹800 / ₹1.2k / ₹1.2L */
function formatAmount(value: number): string {
  if (value === 0) return '';
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

// Top area reserved for the value label, bottom area for the day label
const VALUE_LABEL_HEIGHT = 18;
const DAY_LABEL_HEIGHT = 22;
const CONTAINER_PADDING = 16; // matches styles.container padding

export default function BarChart({ data, barColor = COLORS.accent, height = 160 }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  // Subtract top + bottom padding so bars stay inside the card
  const barAreaHeight = height - CONTAINER_PADDING * 2 - VALUE_LABEL_HEIGHT - DAY_LABEL_HEIGHT;

  const hasData = data.some(d => d.value > 0);
  if (!hasData) {
    return (
      <View style={[styles.container, { height, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.muted, fontSize: 14 }}>No spending in this period</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsRow}>
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * barAreaHeight;
          const isMax = point.value === maxValue && point.value > 0;
          return (
            <View key={index} style={styles.barWrap}>
              {/* Amount label above the bar */}
              <Text
                style={[styles.valueLabel, isMax && styles.valueLabelHighlight]}
                numberOfLines={1}>
                {formatAmount(point.value)}
              </Text>

              {/* Bar */}
              <View style={[styles.barOuter, { height: barAreaHeight }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight || 0,
                      backgroundColor: isMax ? barColor : barColor + 'AA',
                    },
                  ]}
                />
              </View>

              {/* Day / week label */}
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
  valueLabel: {
    color: COLORS.muted,
    fontSize: 9,
    height: VALUE_LABEL_HEIGHT,
    textAlignVertical: 'bottom',
    textAlign: 'center',
  },
  valueLabelHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  barOuter: {
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '55%',
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
    height: DAY_LABEL_HEIGHT - 6,
    textAlign: 'center',
  },
});
