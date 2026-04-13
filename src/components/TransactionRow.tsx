import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Transaction } from '../types';
import { COLORS } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { getCategoryMeta } from '../services/categoryService';

const ACTION_WIDTH = 72; // width of each swipe action button
const SWIPE_THRESHOLD = ACTION_WIDTH * 0.5;

interface Props {
  transaction: Transaction;
  onPress?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
}

export default function TransactionRow({
  transaction,
  onPress,
  onDelete,
  onEdit,
}: Props) {
  const { state } = useApp();
  const meta = getCategoryMeta(state.categories, transaction.category);
  const date = new Date(transaction.date);
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday =
    new Date(Date.now() - 86400000).toDateString() === date.toDateString();
  const dateLabel = isToday
    ? 'Today'
    : isYesterday
    ? 'Yesterday'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  // ── Swipe ──────────────────────────────────────────────────────────────────
  const translateX = useRef(new Animated.Value(0)).current;

  const snapTo = useCallback(
    (toValue: number) => {
      Animated.spring(translateX, {
        toValue,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    },
    [translateX],
  );

  const close = useCallback(() => snapTo(0), [snapTo]);

  const panResponder = useRef(
    PanResponder.create({
      // Only capture when horizontal motion dominates
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => {
        const hasDelete = Boolean(onDelete);
        const hasEdit = Boolean(onEdit);
        // Clamp: allow swipe only in directions that have an action
        const min = hasDelete ? -(ACTION_WIDTH + 12) : 0;
        const max = hasEdit ? ACTION_WIDTH + 12 : 0;
        translateX.setValue(Math.max(min, Math.min(max, dx)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const fast = Math.abs(vx) > 0.5;
        if ((dx < -SWIPE_THRESHOLD || (dx < 0 && fast)) && onDelete) {
          snapTo(-ACTION_WIDTH);
        } else if ((dx > SWIPE_THRESHOLD || (dx > 0 && fast)) && onEdit) {
          snapTo(ACTION_WIDTH);
        } else {
          snapTo(0);
        }
      },
      onPanResponderTerminate: () => snapTo(0),
    }),
  ).current;

  const handleDelete = useCallback(() => {
    close();
    onDelete?.(transaction);
  }, [close, onDelete, transaction]);

  const handleEdit = useCallback(() => {
    close();
    onEdit?.(transaction);
  }, [close, onEdit, transaction]);

  const handlePress = useCallback(() => {
    // If the card is open, a tap just closes it
    // @ts-ignore — _value is private but reliable
    const currentX = translateX._value as number;
    if (Math.abs(currentX) > 4) {
      close();
    } else {
      onPress?.(transaction);
    }
  }, [close, onPress, transaction, translateX]);

  return (
    <View style={styles.wrapper}>
      {/* Edit action — revealed on right swipe */}
      {onEdit && (
        <TouchableOpacity
          style={[styles.action, styles.actionEdit]}
          onPress={handleEdit}
          activeOpacity={0.8}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
      )}

      {/* Delete action — revealed on left swipe */}
      {onDelete && (
        <TouchableOpacity
          style={[styles.action, styles.actionDelete]}
          onPress={handleDelete}
          activeOpacity={0.8}>
          <Text style={styles.actionIcon}>🗑</Text>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      )}

      {/* Sliding card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={styles.card}>
          <View
            style={[styles.iconWrap, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.merchant}>{transaction.merchant}</Text>
            <Text style={styles.sub}>
              {transaction.category} · {dateLabel} · {timeStr}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>
              - ₹{transaction.amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.source}>{transaction.source}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    // Action buttons are absolutely positioned behind the sliding card
    position: 'relative',
  },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionEdit: {
    left: 0,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
  },
  actionDelete: {
    right: 0,
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger + '60',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    borderRadius: 12,
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
