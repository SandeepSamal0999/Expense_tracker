import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../constants/colors';
import { Transaction } from '../../types';
import { getCategoryMeta } from '../../services/categoryService';
import TransactionRow from '../../components/TransactionRow';
import EmptyState from '../../components/EmptyState';
import DepositsModal from '../../components/DepositsModal';
import {
  istDateString,
  istDateStringDaysAgo,
  istMonthString,
  istMonthStringMonthsAgo,
} from '../../utils/dateIST';

const QUICK_ACTIONS = [
  { key: 'add', icon: '➕', bg: '#FDE1E6', fg: '#E4374F', label: 'Add Expense' },
  { key: 'house', icon: '🏗️', bg: '#DCEBFF', fg: '#2563EB', label: 'House Build' },
  { key: 'budget', icon: '🎯', bg: '#DCF6E8', fg: COLORS.success, label: 'Budgets' },
  { key: 'reports', icon: '📊', bg: '#EDE1FB', fg: '#7C3AED', label: 'Reports' },
] as const;

export default function DashboardScreen({ navigation }: any) {
  const { state, addExpense, deleteExpense } = useApp();
  const { show } = useToast();
  const { expenses, budgets, user, categories } = state;
  const [showDeposits, setShowDeposits] = useState(false);

  const now = new Date();
  const currentMonth = istMonthString(now);
  const prevMonth = istMonthStringMonthsAgo(1, now);

  const stats = useMemo(() => {
    const isDebit = (e: (typeof expenses)[number]) => (e.type ?? 'debit') === 'debit';
    const monthTxns = expenses.filter(e => istMonthString(new Date(e.date)) === currentMonth);
    const prevMonthTxns = expenses.filter(e => istMonthString(new Date(e.date)) === prevMonth);
    const todayStr = istDateString(now);
    const yesterdayStr = istDateStringDaysAgo(1, now);

    // Separate debits (expenses) from credits (deposits)
    // Transactions without a type field are treated as debits (backward compat)
    const monthDebits = monthTxns.filter(isDebit);
    const monthCredits = monthTxns.filter(e => e.type === 'credit');
    const prevMonthDebits = prevMonthTxns.filter(isDebit);

    const todayDebits = expenses.filter(
      e => istDateString(new Date(e.date)) === todayStr && isDebit(e),
    );
    const yesterdayDebits = expenses.filter(
      e => istDateString(new Date(e.date)) === yesterdayStr && isDebit(e),
    );

    const totalMonth = monthDebits.reduce((s, e) => s + e.amount, 0);
    const totalPrevMonth = prevMonthDebits.reduce((s, e) => s + e.amount, 0);
    const totalToday = todayDebits.reduce((s, e) => s + e.amount, 0);
    const totalYesterday = yesterdayDebits.reduce((s, e) => s + e.amount, 0);
    const totalDeposits = monthCredits.reduce((s, e) => s + e.amount, 0);

    const monthChangePct =
      totalPrevMonth > 0 ? ((totalMonth - totalPrevMonth) / totalPrevMonth) * 100 : null;
    const dayChangePct =
      totalYesterday > 0 ? ((totalToday - totalYesterday) / totalYesterday) * 100 : null;

    // Last 7 days of debit totals, oldest → newest, for the mini sparkline
    const sparkline = Array.from({ length: 7 }).map((_, i) => {
      const dayStr = istDateStringDaysAgo(6 - i, now);
      return expenses
        .filter(e => isDebit(e) && istDateString(new Date(e.date)) === dayStr)
        .reduce((s, e) => s + e.amount, 0);
    });

    const categoryTotals: Record<string, number> = {};
    monthDebits.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return {
      totalMonth,
      totalToday,
      totalDeposits,
      txCount: monthDebits.length,
      depositCount: monthCredits.length,
      depositTxns: monthCredits,
      categoryTotals,
      monthChangePct,
      dayChangePct,
      sparkline,
    };
  }, [expenses, currentMonth, prevMonth]);

  const sparkMax = Math.max(...stats.sparkline, 1);

  const insight = useMemo(() => {
    if (stats.monthChangePct === null) return null;
    const pct = Math.round(Math.abs(stats.monthChangePct));
    if (stats.monthChangePct <= 0) {
      return {
        good: true,
        title: "You're doing great!",
        message: `Your spending is ${pct}% lower than last month. Keep it up!`,
      };
    }
    return {
      good: false,
      title: 'Heads up!',
      message: `Your spending is ${pct}% higher than last month.`,
    };
  }, [stats.monthChangePct]);

  const recentTxns = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [expenses],
  );

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

  const handleQuickAction = useCallback(
    (key: (typeof QUICK_ACTIONS)[number]['key']) => {
      if (key === 'add') {
        navigation.navigate('Transactions', { screen: 'AddExpense' });
      } else if (key === 'house') {
        navigation.navigate('House');
      } else if (key === 'budget') {
        navigation.navigate('Budget');
      } else if (key === 'reports') {
        navigation.navigate('Analytics');
      }
    },
    [navigation, show],
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerDecor} pointerEvents="none">
              <View style={styles.decorSun} />
              <View style={styles.decorHillBack} />
              <View style={styles.decorHillFront} />
            </View>

            <View style={styles.headerTop}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.greetingName}>{user?.name || 'User'} 👋</Text>
              </View>
              <View style={styles.headerRightBlock}>
                <Text style={styles.brandTagline}>Track{'\n'}Save{'\n'}Grow</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.7}>
                    <Text style={styles.iconBtnText}>🔔</Text>
                    <View style={styles.notifDot} />
                  </TouchableOpacity>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.tagline}>Small steps. Big financial freedom.</Text>
          </View>

          {/* Metric cards */}
          <View style={styles.metricsRow}>
            <TouchableOpacity
              style={[styles.metricCard, styles.metricMonth]}
              onPress={() => navigation.navigate('Transactions')}
              activeOpacity={0.85}>
              <View style={styles.metricTop}>
                <View style={styles.metricTopLeft}>
                  <View style={[styles.metricIcon, { backgroundColor: COLORS.successDim }]}>
                    <Text style={styles.metricIconText}>💼</Text>
                  </View>
                  <Text style={styles.metricLabel}>This Month</Text>
                </View>
                <Text style={styles.metricChevron}>›</Text>
              </View>
              <Text style={styles.metricValue}>₹{stats.totalMonth.toLocaleString('en-IN')}</Text>
              {stats.monthChangePct !== null && (
                <View style={styles.changeRow}>
                  <View
                    style={[
                      styles.changePill,
                      stats.monthChangePct >= 0 ? styles.pillUp : styles.pillDown,
                    ]}>
                    <Text
                      style={[
                        styles.changePillText,
                        stats.monthChangePct >= 0 ? styles.pillUpText : styles.pillDownText,
                      ]}>
                      {stats.monthChangePct >= 0 ? '↑' : '↓'}{' '}
                      {Math.round(Math.abs(stats.monthChangePct))}%
                    </Text>
                  </View>
                  <Text style={styles.changeCompare}>vs last month</Text>
                </View>
              )}
              <View style={styles.sparkRow}>
                {stats.sparkline.map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sparkBar,
                      {
                        height: 3 + (v / sparkMax) * 13,
                        backgroundColor:
                          i === stats.sparkline.length - 1
                            ? COLORS.accent
                            : COLORS.accent + '45',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.metricSubtitle}>{stats.txCount} transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricCard, styles.metricToday]}
              onPress={() => navigation.navigate('Transactions')}
              activeOpacity={0.85}>
              <View style={styles.metricTop}>
                <View style={styles.metricTopLeft}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DCEBFF' }]}>
                    <Text style={styles.metricIconText}>📅</Text>
                  </View>
                  <Text style={styles.metricLabel}>Today</Text>
                </View>
                <Text style={styles.metricChevron}>›</Text>
              </View>
              <Text style={styles.metricValue}>₹{stats.totalToday.toLocaleString('en-IN')}</Text>
              {stats.dayChangePct !== null ? (
                <View style={styles.changeRow}>
                  <View
                    style={[
                      styles.changePill,
                      stats.dayChangePct >= 0 ? styles.pillUp : styles.pillDown,
                    ]}>
                    <Text
                      style={[
                        styles.changePillText,
                        stats.dayChangePct >= 0 ? styles.pillUpText : styles.pillDownText,
                      ]}>
                      {stats.dayChangePct >= 0 ? '↑' : '↓'}{' '}
                      {Math.round(Math.abs(stats.dayChangePct))}%
                    </Text>
                  </View>
                  <Text style={styles.changeCompare}>vs yesterday</Text>
                </View>
              ) : (
                <Text style={styles.metricSubtitle}>No spending yesterday</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Total deposits banner */}
          <TouchableOpacity
            style={styles.depositCard}
            onPress={() => setShowDeposits(true)}
            activeOpacity={0.85}>
            <View style={styles.depositLeft}>
              <View style={styles.depositIcon}>
                <Text style={styles.depositIconText}>🏦</Text>
              </View>
              <View>
                <Text style={styles.depositLabel}>Total Deposits</Text>
                <Text style={styles.depositValue}>
                  ₹{stats.totalDeposits.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.depositHint}>
                  {stats.depositCount > 0
                    ? `${stats.depositCount} deposit${stats.depositCount !== 1 ? 's' : ''} this month`
                    : 'Start your savings journey today! 🌱'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() =>
                navigation.navigate('Transactions', {
                  screen: 'AddExpense',
                  params: { presetType: 'credit' },
                })
              }
              activeOpacity={0.85}>
              <Text style={styles.addMoneyText}>Add Money →</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.quickItem}
                onPress={() => handleQuickAction(action.key)}
                activeOpacity={0.8}>
                <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                  <Text style={styles.quickIconText}>{action.icon}</Text>
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {topCategories.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Spending</Text>
                <Text style={styles.sectionPeriod}>This Month</Text>
              </View>
              <View style={styles.categoriesRow}>
                {topCategories.map(([cat, amount]) => {
                  const meta = getCategoryMeta(categories, cat);
                  const pct =
                    stats.totalMonth > 0
                      ? ((amount ?? 0) / stats.totalMonth) * 100
                      : 0;
                  return (
                    <View
                      key={cat}
                      style={[
                        styles.catCard,
                        {
                          backgroundColor: meta.color + '14',
                          borderColor: meta.color + '30',
                        },
                      ]}>
                      <View
                        style={[
                          styles.catIcon,
                          { backgroundColor: meta.color + '25' },
                        ]}>
                        <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      </View>
                      <Text style={styles.catLabel} numberOfLines={1}>
                        {cat}
                      </Text>
                      <Text style={[styles.catAmount, { color: meta.color }]}>
                        ₹{(amount ?? 0).toLocaleString('en-IN')}
                      </Text>
                      <View style={styles.catBarBg}>
                        <View
                          style={[
                            styles.catBar,
                            {
                              width: `${pct}%`,
                              backgroundColor: meta.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.catPct}>{Math.round(pct)}%</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {insight && (
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: insight.good ? COLORS.successDim : COLORS.warningDim,
                  borderColor: insight.good ? COLORS.success + '40' : COLORS.warning + '40',
                },
              ]}>
              <Text style={styles.insightIcon}>💡</Text>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.insightBtn,
                  { backgroundColor: insight.good ? COLORS.success : COLORS.warning },
                ]}
                onPress={() => navigation.navigate('Analytics')}
                activeOpacity={0.85}>
                <Text style={styles.insightBtnText}>View Insights →</Text>
              </TouchableOpacity>
            </View>
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
                onDelete={handleDelete}
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

      <DepositsModal
        visible={showDeposits}
        transactions={stats.depositTxns}
        periodLabel="This Month"
        onClose={() => setShowDeposits(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 80 },
  // Header
  headerCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EAF4EF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  headerDecor: { ...StyleSheet.absoluteFillObject },
  decorSun: {
    position: 'absolute',
    top: -18,
    right: 14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD98A',
    opacity: 0.9,
  },
  decorHillBack: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 180,
    height: 70,
    borderRadius: 60,
    backgroundColor: '#CFE7D6',
  },
  decorHillFront: {
    position: 'absolute',
    bottom: -38,
    right: -24,
    width: 200,
    height: 80,
    borderRadius: 70,
    backgroundColor: '#BFE0C8',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: { flexShrink: 1, paddingRight: 8, marginTop: 6 },
  greeting: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  greetingName: { color: COLORS.text, fontSize: 19, fontWeight: '800', marginTop: -2 },
  tagline: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  headerRightBlock: { alignItems: 'flex-end' },
  brandTagline: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 13,
    marginBottom: 8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 15 },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Metric cards
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricMonth: { flex: 1.5 },
  metricToday: { flex: 1 },
  metricCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 12,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconText: { fontSize: 14 },
  metricChevron: { color: COLORS.muted, fontSize: 18, fontWeight: '600' },
  metricLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },
  metricValue: { color: COLORS.text, fontSize: 19, fontWeight: 'bold', marginTop: 2 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  changePill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  pillUp: { backgroundColor: COLORS.successDim },
  pillDown: { backgroundColor: COLORS.dangerDim },
  changePillText: { fontSize: 10, fontWeight: '700' },
  pillUpText: { color: COLORS.success },
  pillDownText: { color: COLORS.danger },
  changeCompare: { color: COLORS.muted, fontSize: 10 },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 16, marginTop: 6 },
  sparkBar: { width: 6, borderRadius: 3 },
  metricSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  // Deposit card
  depositCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#FBBF7A50',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  depositLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  depositIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE2BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositIconText: { fontSize: 20 },
  depositLabel: { color: '#B45309', fontSize: 12, fontWeight: '600' },
  depositValue: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  depositHint: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  addMoneyBtn: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addMoneyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Quick actions
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickIconText: { fontSize: 22 },
  quickLabel: { color: COLORS.text, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  // Categories
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
  sectionPeriod: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  seeAll: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  catCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  catIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  catEmoji: { fontSize: 11 },
  catLabel: { color: COLORS.muted, fontSize: 10 },
  catAmount: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  catBarBg: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  catBar: { height: '100%', borderRadius: 2 },
  catPct: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  // Insight banner
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  insightIcon: { fontSize: 22 },
  insightText: { flex: 1 },
  insightTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  insightMessage: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  insightBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  insightBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // FAB
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
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
