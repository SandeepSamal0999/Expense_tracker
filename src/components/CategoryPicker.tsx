import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '../types';
import { COLORS, CATEGORY_META, ALL_CATEGORIES } from '../constants/colors';

interface Props {
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {ALL_CATEGORIES.map(cat => {
        const meta = CATEGORY_META[cat];
        const isSelected = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            style={[
              styles.item,
              isSelected && { borderColor: meta.color, backgroundColor: meta.color + '15' },
            ]}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
            <Text style={[styles.label, isSelected && { color: meta.color }]}>
              {meta.label}
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
