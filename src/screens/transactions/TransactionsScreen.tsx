import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, ALL_CATEGORIES, CATEGORY_META } from '../../constants/colors';
import { Category, Transaction } from '../../types';
import TransactionRow from '../../components/TransactionRow';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function TransactionsScreen({ navigation }: any) {
  const { state } = useApp();
  const { expenses } = state;

  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return expenses.filter(tx => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !tx.merchant.toLowerCase().includes(q) &&
          !tx.notes.toLowerCase().includes(q) &&
          !tx.category.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && tx.category !== categoryFilter) {
        return false;
      }

      // Time filter
      const txDate = new Date(tx.date);
      if (timeFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        return txDate >= weekAgo;
      }
      if (timeFilter === 'month') {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [expenses, search, timeFilter, categoryFilter]);

  const sections = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const d = new Date(tx.date);
      const today = new Date();
      const yesterday = new Date(Date.now() - 86400000);
      let label: string;
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.totalLabel}>
          Total: <Text style={styles.totalValue}>₹{totalFiltered.toLocaleString('en-IN')}</Text>
        </Text>
      </View>

      <View style={styles.filtersArea}>
        <SearchBar value={search} onChangeText={setSearch} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}>
          {timeFilters.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, timeFilter === f.value && styles.chipActive]}
              onPress={() => setTimeFilter(f.value)}>
              <Text
                style={[
                  styles.chipText,
                  timeFilter === f.value && styles.chipTextActive,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                categoryFilter === cat && {
                  backgroundColor: CATEGORY_META[cat].color + '20',
                  borderColor: CATEGORY_META[cat].color,
                },
              ]}
              onPress={() =>
                setCategoryFilter(categoryFilter === cat ? null : cat)
              }>
              <Text
                style={[
                  styles.chipText,
                  categoryFilter === cat && { color: CATEGORY_META[cat].color },
                ]}>
                {CATEGORY_META[cat].emoji} {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={tx =>
              navigation.navigate('AddExpense', { transaction: tx })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="No transactions found"
            message={
              search || categoryFilter
                ? 'Try adjusting your search or filters'
                : 'Tap the + button to add your first expense'
            }
          />
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  totalValue: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  filtersArea: {
    paddingHorizontal: 20,
  },
  chipsRow: {
    marginBottom: 8,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.accent,
  },
  chipDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  sectionHeader: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: COLORS.bg,
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
