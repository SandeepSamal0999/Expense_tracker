import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryPicker({ selected, onSelect }: Props) {
  const { state } = useApp();

  return (
    <View style={styles.grid}>
      {state.categories.map(cat => {
        const isSelected = cat.name === selected;
        return (
          <TouchableOpacity
            key={cat.name}
            style={[
              styles.item,
              isSelected && { borderColor: cat.color, backgroundColor: cat.color + '15' },
            ]}
            onPress={() => onSelect(cat.name)}
            activeOpacity={0.7}>
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.label, isSelected && { color: cat.color }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: '28%',
    flexGrow: 1,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
  },
});
