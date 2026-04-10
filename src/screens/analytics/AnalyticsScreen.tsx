import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/colors';
import { getCategoryMeta } from '../../services/categoryService';
import { Transaction } from '../../types';
import BarChart from '../../components/BarChart';
import EmptyState from '../../components/EmptyState';

type Period = 'week' | 'month';

export default function AnalyticsScreen() {
  const { state } = useApp();
  const { expenses, categories } = state;
  const [period, setPeriod] = useState<Period>('week');

  const now = new Date();

  const filteredExpenses = useMemo(() => {
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return expenses.filter(e => new Date(e.date) >= weekAgo);
    }
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [expenses, period]);

  const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a);
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyTotals = new Array(7).fill(0);
      filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        dailyTotals[d.getDay()] += e.amount;
      });
      return days.map((label, i) => ({ label, value: dailyTotals[i] }));
    }
    // Monthly: group by week
    const weeks: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const label = `W${weekNum}`;
      weeks[label] = (weeks[label] || 0) + e.amount;
    });
    return Object.entries(weeks).map(([label, value]) => ({ label, value }));
  }, [filteredExpenses, period]);

  const topMerchants = useMemo(() => {
    const merchants: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      merchants[e.merchant] = (merchants[e.merchant] || 0) + e.amount;
    });
    return Object.entries(merchants)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredExpenses]);

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

        <View style={styles.periodRow}>
          {(['week', 'month'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalSub}>{filteredExpenses.length} transactions</Text>
        </View>

        <Text style={styles.sectionTitle}>Spending Trend</Text>
        <BarChart data={chartData} height={160} />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Category Breakdown</Text>
        {categoryTotals.map(([cat, amount]) => {
          const meta = getCategoryMeta(categories, cat);
          const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          return (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catInfo}>
                <View style={[styles.catIcon, { backgroundColor: meta.color + '20' }]}>
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
            const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            return (
              <View key={cat} style={styles.progressRow}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {meta.emoji} {cat}
                  </Text>
                  <Text style={styles.progressPct}>{pct.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${pct}%`, backgroundColor: meta.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {topMerchants.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Top Merchants</Text>
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
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  periodText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  periodTextActive: {
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
