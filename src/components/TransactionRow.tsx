import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../types';
import { COLORS } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { getCategoryMeta } from '../services/categoryService';

interface Props {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export default function TransactionRow({ transaction, onPress }: Props) {
  const { state } = useApp();
  const meta = getCategoryMeta(state.categories, transaction.category);
  const date = new Date(transaction.date);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday =
    new Date(Date.now() - 86400000).toDateString() === date.toDateString();
  const dateLabel = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.merchant}>{transaction.merchant}</Text>
        <Text style={styles.sub}>
          {transaction.category} · {dateLabel} · {timeStr}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>- ₹{transaction.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.source}>{transaction.source}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  merchant: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },
  sub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  source: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },
});
