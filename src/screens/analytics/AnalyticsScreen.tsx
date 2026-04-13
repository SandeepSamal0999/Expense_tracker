import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/colors';
import { getCategoryMeta } from '../../services/categoryService';
import BarChart from '../../components/BarChart';
import EmptyState from '../../components/EmptyState';
import MonthPickerModal, { MONTH_NAMES } from '../../components/MonthPickerModal';

type Period = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function AnalyticsScreen() {
  const { state } = useApp();
  const { expenses, categories } = state;

  const now = new Date();

  const [period, setPeriod] = useState<Period>('month');
  const [customMonth, setCustomMonth] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });
  const [showPicker, setShowPicker] = useState(false);

  // ── Filtered expenses based on selected period ──────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
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
  }, [expenses, period, customMonth]);

  const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Chart data — grouped differently per period ─────────────────────────────
  const chartData = useMemo(() => {
    if (period === 'all') {
      // Last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const value = expenses
          .filter(e => {
            const ed = new Date(e.date);
            return ed.getMonth() === m && ed.getFullYear() === y;
          })
          .reduce((s, e) => s + e.amount, 0);
        return { label: MONTH_NAMES[m], value };
      });
    }

    if (period === 'today') {
      // Four time slots
      const slots = [
        { label: 'Morn', start: 5, end: 12 },
        { label: 'Noon', start: 12, end: 17 },
        { label: 'Eve', start: 17, end: 21 },
        { label: 'Night', start: 21, end: 29 }, // wraps past midnight
      ];
      return slots.map(({ label, start, end }) => {
        const value = filteredExpenses
          .filter(e => {
            const h = new Date(e.date).getHours();
            return h >= start && h < Math.min(end, 24);
          })
          .reduce((s, e) => s + e.amount, 0);
        return { label, value };
      });
    }

    if (period === 'week') {
      // Last 7 days in calendar order
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyTotals = new Array(7).fill(0);
      filteredExpenses.forEach(e => {
        dailyTotals[new Date(e.date).getDay()] += e.amount;
      });
      return DAYS.map((label, i) => ({ label, value: dailyTotals[i] }));
    }

    // 'month' or 'custom' — group by week of month
    const weeks: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const weekNum = Math.ceil(new Date(e.date).getDate() / 7);
      const label = `W${weekNum}`;
      weeks[label] = (weeks[label] || 0) + e.amount;
    });
    // Ensure W1–W4 always appear (even if zero) so chart isn't empty
    const targetMonth =
      period === 'custom' ? customMonth.month : now.getMonth();
    const targetYear =
      period === 'custom' ? customMonth.year : now.getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const numWeeks = Math.ceil(daysInMonth / 7);
    return Array.from({ length: numWeeks }, (_, i) => {
      const label = `W${i + 1}`;
      return { label, value: weeks[label] ?? 0 };
    });
  }, [expenses, filteredExpenses, period, customMonth]);

  // ── Category totals ─────────────────────────────────────────────────────────
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).sort(([, a], [, b]) => b - a);
  }, [filteredExpenses]);

  // ── Top merchants ───────────────────────────────────────────────────────────
  const topMerchants = useMemo(() => {
    const merchants: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      merchants[e.merchant] = (merchants[e.merchant] || 0) + e.amount;
    });
    return Object.entries(merchants)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredExpenses]);

  const customLabel = `${MONTH_NAMES[customMonth.month]} ${customMonth.year}`;

  const periodChips: { label: string; value: Period }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analytics</Text>
        <EmptyState
          icon="📊"
          title="No data yet"
          message="Add some expenses to see your spending analytics"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Analytics</Text>

        {/* Period filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}>
          {periodChips.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[styles.chip, period === p.value && styles.chipActive]}
              onPress={() => setPeriod(p.value)}>
              <Text
                style={[
                  styles.chipText,
                  period === p.value && styles.chipTextActive,
                ]}>
                {p.label}
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
        </ScrollView>

        {/* Summary card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalValue}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.totalSub}>
            {filteredExpenses.length} transaction
            {filteredExpenses.length !== 1 ? 's' : ''}
            {period === 'custom'
              ? ` · ${customLabel}`
              : period !== 'all'
              ? ` · ${periodChips.find(p => p.value === period)?.label}`
              : ''}
          </Text>
        </View>

        {/* Spending trend chart */}
        <Text style={styles.sectionTitle}>Spending Trend</Text>
        <BarChart data={chartData} height={180} />

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Category Breakdown
            </Text>
            {categoryTotals.map(([cat, amount]) => {
              const meta = getCategoryMeta(categories, cat);
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <View
                      style={[
                        styles.catIcon,
                        { backgroundColor: meta.color + '20' },
                      ]}>
                      <Text style={styles.catEmoji}>{meta.emoji}</Text>
                    </View>
                    <View>
                      <Text style={styles.catName}>{cat}</Text>
                      <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <Text style={[styles.catAmount, { color: meta.color }]}>
                    ₹{amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}

            <View style={styles.progressSection}>
              {categoryTotals.map(([cat, amount]) => {
                const meta = getCategoryMeta(categories, cat);
                const pct =
                  totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                return (
                  <View key={cat} style={styles.progressRow}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>
                        {meta.emoji} {cat}
                      </Text>
                      <Text style={styles.progressPct}>
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Top merchants */}
        {topMerchants.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Top Merchants
            </Text>
            {topMerchants.map(([name, amount], i) => (
              <View key={name} style={styles.merchantRow}>
                <View style={styles.merchantLeft}>
                  <Text style={styles.merchantRank}>#{i + 1}</Text>
                  <Text style={styles.merchantName}>{name}</Text>
                </View>
                <Text style={styles.merchantAmount}>
                  ₹{amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chipsRow: {
    marginBottom: 20,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 4,
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
  totalCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  totalValue: {
    color: COLORS.accent,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  totalSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 18,
  },
  catName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  catPct: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  catAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 24,
  },
  progressRow: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  progressPct: {
    color: COLORS.muted,
    fontSize: 12,
  },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  merchantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  merchantRank: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    width: 24,
  },
  merchantName: {
    color: COLORS.text,
    fontSize: 15,
  },
  merchantAmount: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});
