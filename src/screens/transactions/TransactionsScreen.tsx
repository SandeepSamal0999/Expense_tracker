import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  RefreshControl,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../constants/colors';
import { Transaction } from '../../types';
import TransactionRow from '../../components/TransactionRow';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import MonthPickerModal, { MONTH_NAMES } from '../../components/MonthPickerModal';

type Period = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function TransactionsScreen({ navigation }: any) {
  const { state, addExpense, deleteExpense, refreshData } = useApp();
  const { show } = useToast();
  const { expenses, categories } = state;

  const now = new Date();

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [customMonth, setCustomMonth] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDelete = useCallback(
    (tx: Transaction) => {
      deleteExpense(tx.id);
      show({
        text: `${tx.merchant} deleted`,
        subtext: `₹${tx.amount.toLocaleString('en-IN')}`,
        onUndo: () => addExpense(tx),
      });
    },
    [deleteExpense, addExpense, show],
  );

  const handleEdit = useCallback(
    (tx: Transaction) => {
      navigation.navigate('AddExpense', { transaction: tx });
    },
    [navigation],
  );

  const filtered = useMemo(() => {
    return expenses.filter(tx => {
      // Search
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

      // Category
      if (categoryFilter && tx.category !== categoryFilter) return false;

      // Period
      const d = new Date(tx.date);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        return d >= weekAgo;
      }
      if (period === 'month') {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'custom') {
        return (
          d.getMonth() === customMonth.month &&
          d.getFullYear() === customMonth.year
        );
      }
      return true; // 'all'
    });
  }, [expenses, search, period, categoryFilter, customMonth]);

  const sections = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    filtered.forEach(tx => {
      const d = new Date(tx.date);
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

  const customLabel =
    `${MONTH_NAMES[customMonth.month]} ${customMonth.year}`;

  const periodChips: { label: string; value: Period }[] = [
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
          Total:{' '}
          <Text style={styles.totalValue}>
            ₹{totalFiltered.toLocaleString('en-IN')}
          </Text>
        </Text>
      </View>

      <View style={styles.filtersArea}>
        <SearchBar value={search} onChangeText={setSearch} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}>

          {/* Period chips */}
          {periodChips.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, period === f.value && styles.chipActive]}
              onPress={() => setPeriod(f.value)}>
              <Text
                style={[
                  styles.chipText,
                  period === f.value && styles.chipTextActive,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom month chip */}
          <TouchableOpacity
            style={[styles.chip, period === 'custom' && styles.chipActive]}
            onPress={() => setShowPicker(true)}>
            <Text
              style={[
                styles.chipText,
                period === 'custom' && styles.chipTextActive,
              ]}>
              {period === 'custom' ? customLabel : '📅 Pick Month'}
            </Text>
          </TouchableOpacity>

          <View style={styles.chipDivider} />

          {/* Category chips */}
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.chip,
                categoryFilter === cat.name && {
                  backgroundColor: cat.color + '20',
                  borderColor: cat.color,
                },
              ]}
              onPress={() =>
                setCategoryFilter(categoryFilter === cat.name ? null : cat.name)
              }>
              <Text
                style={[
                  styles.chipText,
                  categoryFilter === cat.name && { color: cat.color },
                ]}>
                {cat.emoji} {cat.name}
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
            onPress={tx => navigation.navigate('AddExpense', { transaction: tx })}
            onDelete={handleDelete}
            onEdit={handleEdit}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
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

      <MonthPickerModal
        visible={showPicker}
        selectedMonth={customMonth.month}
        selectedYear={customMonth.year}
        onSelect={(month, year) => {
          setCustomMonth({ month, year });
          setPeriod('custom');
        }}
        onClose={() => setShowPicker(false)}
      />
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
