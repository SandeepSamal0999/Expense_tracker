import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/colors';
import { getCategoryMeta } from '../../services/categoryService';
import MetricCard from '../../components/MetricCard';
import TransactionRow from '../../components/TransactionRow';
import EmptyState from '../../components/EmptyState';

export default function DashboardScreen({ navigation }: any) {
  const { state } = useApp();
  const { expenses, user, categories } = state;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const todayStr = now.toDateString();
    const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === todayStr);

    const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);

    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return { totalMonth, totalToday, txCount: monthExpenses.length, categoryTotals };
  }, [expenses, currentMonth]);

  const recentTxns = expenses.slice(0, 5);

  const topCategories = useMemo(() => {
    return Object.entries(stats.categoryTotals)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 4);
  }, [stats.categoryTotals]);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.greeting}>
            {greeting}, {user?.name || 'User'}
          </Text>
          <Text style={styles.date}>
            {now.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricHalf}>
              <MetricCard
                label="This Month"
                value={`₹${stats.totalMonth.toLocaleString('en-IN')}`}
                subtitle={`${stats.txCount} transactions`}
              />
            </View>
            <View style={styles.metricHalf}>
              <MetricCard
                label="Today"
                value={`₹${stats.totalToday.toLocaleString('en-IN')}`}
                accentColor={COLORS.text}
              />
            </View>
          </View>

          {topCategories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Spending</Text>
              <View style={styles.categoriesRow}>
                {topCategories.map(([cat, amount]) => {
                  const meta = getCategoryMeta(categories, cat);
                  const pct = stats.totalMonth > 0 ? ((amount ?? 0) / stats.totalMonth) * 100 : 0;
                  return (
                    <View key={cat} style={styles.catCard}>
                      <View style={[styles.catIcon, { backgroundColor: meta.color + '20' }]}>
                        <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      </View>
                      <Text style={styles.catLabel}>{cat}</Text>
                      <Text style={[styles.catAmount, { color: meta.color }]}>
                        ₹{(amount ?? 0).toLocaleString('en-IN')}
                      </Text>
                      <View style={styles.catBarBg}>
                        <View
                          style={[styles.catBar, { width: `${pct}%`, backgroundColor: meta.color }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentTxns.length > 0 ? (
            recentTxns.map(tx => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onPress={t =>
                  navigation.navigate('Transactions', {
                    screen: 'AddExpense',
                    params: { transaction: t },
                  })
                }
              />
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No expenses yet"
              message="Tap the + button to add your first expense"
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('Transactions', { screen: 'AddExpense' })
        }
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricHalf: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  seeAll: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  catCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 12,
    width: '47%',
    flexGrow: 1,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catEmoji: {
    fontSize: 18,
  },
  catLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  catAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  catBarBg: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  catBar: {
    height: '100%',
    borderRadius: 2,
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
