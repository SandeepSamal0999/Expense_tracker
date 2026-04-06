import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, CATEGORY_META, ALL_CATEGORIES } from '../../constants/colors';
import { Budget, Category } from '../../types';
import EmptyState from '../../components/EmptyState';

export default function BudgetScreen() {
  const { state, addBudget, deleteBudget } = useApp();
  const { expenses, budgets } = state;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Food');
  const [limitInput, setLimitInput] = useState('');

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const spentByCategory = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    monthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);

  const currentBudgets = budgets.filter(b => b.month === currentMonth);

  const totalBudget = currentBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const handleSaveBudget = async () => {
    const limit = parseFloat(limitInput);
    if (!limit || limit <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const budget: Budget = {
      id: `${selectedCategory}-${currentMonth}`,
      category: selectedCategory,
      limit,
      month: currentMonth,
    };
    await addBudget(budget);
    setModalVisible(false);
    setLimitInput('');
  };

  const getStatusColor = (spent: number, limit: number) => {
    const pct = (spent / limit) * 100;
    if (pct >= 100) return COLORS.danger;
    if (pct >= 80) return COLORS.warning;
    return COLORS.success;
  };

  const getStatusLabel = (spent: number, limit: number) => {
    const pct = (spent / limit) * 100;
    if (pct >= 100) return 'Over budget!';
    if (pct >= 80) return 'Almost there';
    return 'On track';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.monthLabel}>{monthLabel}</Text>

          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View>
                <Text style={styles.overviewLabel}>Total Budget</Text>
                <Text style={styles.overviewValue}>
                  ₹{totalBudget.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.overviewRight}>
                <Text style={styles.overviewLabel}>Spent</Text>
                <Text
                  style={[
                    styles.overviewValue,
                    {
                      color:
                        totalSpent > totalBudget
                          ? COLORS.danger
                          : COLORS.text,
                    },
                  ]}>
                  ₹{totalSpent.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            {totalBudget > 0 && (
              <View style={styles.overviewBar}>
                <View
                  style={[
                    styles.overviewBarFill,
                    {
                      width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                      backgroundColor: getStatusColor(totalSpent, totalBudget),
                    },
                  ]}
                />
              </View>
            )}
            <Text style={styles.overviewRemaining}>
              {totalBudget > totalSpent
                ? `₹${(totalBudget - totalSpent).toLocaleString('en-IN')} remaining`
                : totalBudget > 0
                  ? `₹${(totalSpent - totalBudget).toLocaleString('en-IN')} over budget`
                  : 'Set budgets to start tracking'}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Budgets</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Set Budget</Text>
            </TouchableOpacity>
          </View>

          {currentBudgets.length > 0 ? (
            currentBudgets.map(budget => {
              const meta = CATEGORY_META[budget.category];
              const spent = spentByCategory[budget.category] || 0;
              const pct = Math.min((spent / budget.limit) * 100, 100);
              const statusColor = getStatusColor(spent, budget.limit);
              const statusLabel = getStatusLabel(spent, budget.limit);

              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetLeft}>
                      <View style={[styles.catIcon, { backgroundColor: meta.color + '20' }]}>
                        <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      </View>
                      <View>
                        <Text style={styles.budgetCat}>{budget.category}</Text>
                        <Text style={[styles.budgetStatus, { color: statusColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Remove Budget', `Remove ${budget.category} budget?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => deleteBudget(budget.id),
                          },
                        ])
                      }>
                      <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.budgetAmounts}>
                    <Text style={styles.budgetSpent}>
                      ₹{spent.toLocaleString('en-IN')}{' '}
                      <Text style={styles.budgetOf}>
                        / ₹{budget.limit.toLocaleString('en-IN')}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.budgetBarBg}>
                    <View
                      style={[
                        styles.budgetBarFill,
                        { width: `${pct}%`, backgroundColor: statusColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon="💰"
              title="No budgets set"
              message="Tap 'Set Budget' to create category budgets and track your spending"
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Budget</Text>

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
              {ALL_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                const isSelected = cat === selectedCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      isSelected && { borderColor: meta.color, backgroundColor: meta.color + '15' },
                    ]}
                    onPress={() => setSelectedCategory(cat)}>
                    <Text style={styles.catChipText}>
                      {meta.emoji} {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.modalLabel}>Monthly Limit (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="e.g. 5000"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveBudget}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  monthLabel: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  overviewLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  overviewValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  overviewBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  overviewBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  overviewRemaining: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  budgetCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLeft: {
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
  budgetCat: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  budgetStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    color: COLORS.muted,
    fontSize: 16,
    padding: 4,
  },
  budgetAmounts: {
    marginTop: 12,
  },
  budgetSpent: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  budgetOf: {
    color: COLORS.muted,
    fontWeight: '400',
  },
  budgetBarBg: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  catPicker: {
    marginBottom: 16,
  },
  catChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  catChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  modalInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});
