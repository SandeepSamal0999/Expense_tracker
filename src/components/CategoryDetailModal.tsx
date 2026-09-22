import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Transaction } from '../types';
import { istRelativeDayLabel } from '../utils/dateIST';

interface CategoryMeta {
  emoji: string;
  color: string;
}

interface Props {
  visible: boolean;
  categoryName: string;
  categoryMeta: CategoryMeta;
  transactions: Transaction[];
  periodLabel: string;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    istRelativeDayLabel(d) ??
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CategoryDetailModal({
  visible,
  categoryName,
  categoryMeta,
  transactions,
  periodLabel,
  onClose,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      t =>
        t.merchant.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Transaction History</Text>
          <View style={styles.closeBtn} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: categoryMeta.color + '25' }]}>
            <Text style={styles.heroEmoji}>{categoryMeta.emoji}</Text>
          </View>
          <Text style={[styles.heroName, { color: categoryMeta.color }]}>
            {categoryName}
          </Text>
          <Text style={styles.heroSubLabel}>TOTAL {periodLabel.toUpperCase()} SPENDING</Text>
          <Text style={styles.heroTotal}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search merchants or notes..."
            placeholderTextColor={COLORS.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Recent Activity</Text>
          <Text style={styles.listHeaderCount}>
            Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Transaction list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: categoryMeta.color + '20' }]}>
                <Text style={styles.txEmoji}>{categoryMeta.emoji}</Text>
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txMerchant} numberOfLines={1}>
                  {item.merchant}
                </Text>
                <Text style={styles.txSub}>
                  {formatDate(item.date)} · {formatTime(item.date)}
                </Text>
                {item.notes ? (
                  <Text style={styles.txNotes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.txSource}>{item.source}</Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  closeBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Hero section
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroEmoji: {
    fontSize: 38,
  },
  heroName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTotal: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: 'bold',
  },
  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    padding: 0,
  },
  clearSearch: {
    color: COLORS.muted,
    fontSize: 13,
    paddingHorizontal: 4,
  },
  // List
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listHeaderTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  listHeaderCount: {
    color: COLORS.muted,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 20,
  },
  txDetails: {
    flex: 1,
    marginRight: 8,
  },
  txMerchant: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  txSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  txNotes: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  txSource: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});
