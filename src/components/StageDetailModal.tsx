import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { ConstructionStage, StageStatus, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { istRelativeDayLabel } from '../utils/dateIST';

const STATUS_OPTIONS: { value: StageStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

const STATUS_LABEL: Record<StageStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    istRelativeDayLabel(d) ??
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  );
}

interface Props {
  visible: boolean;
  stage: ConstructionStage | null;
  transactions: Transaction[]; // already filtered to this stage
  onClose: () => void;
  onAddExpense: () => void;
}

export default function StageDetailModal({
  visible,
  stage,
  transactions,
  onClose,
  onAddExpense,
}: Props) {
  const { updateStage, deleteStage } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<StageStatus>('not_started');

  if (!stage) return null;

  const spent = transactions.reduce((s, t) => s + t.amount, 0);
  const hasBudget = stage.budget > 0;
  const pct = hasBudget ? Math.min((spent / stage.budget) * 100, 100) : 0;
  const overBudget = hasBudget && spent > stage.budget;
  const statusColor =
    overBudget ? COLORS.danger : pct >= 80 ? COLORS.warning : COLORS.success;

  const startEdit = () => {
    setName(stage.name);
    setDescription(stage.description || '');
    setBudget(stage.budget > 0 ? String(stage.budget) : '');
    setStatus(stage.status);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a stage name');
      return;
    }
    await updateStage(stage.id, {
      name: name.trim(),
      description: description.trim(),
      budget: parseFloat(budget) || 0,
      status,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Stage',
      `Delete "${stage.name}"? Expenses already tagged to it will keep their amount but lose the stage link.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStage(stage.id);
            setEditing(false);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Stage</Text>
          <TouchableOpacity
            onPress={() => (editing ? setEditing(false) : startEdit())}
            style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{editing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Stage Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Excavation, footings and foundation work"
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.label}>Budget (₹, optional)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusChip, status === opt.value && styles.statusChipActive]}
                  onPress={() => setStatus(opt.value)}>
                  <Text
                    style={[
                      styles.statusChipText,
                      status === opt.value && styles.statusChipTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Stage</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroName}>{stage.name}</Text>
              {!!stage.description && (
                <Text style={styles.heroDescription}>{stage.description}</Text>
              )}
              <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {STATUS_LABEL[stage.status]}
                </Text>
              </View>
              <Text style={styles.heroTotal}>₹{spent.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroSubLabel}>SPENT ON THIS STAGE</Text>

              {hasBudget && (
                <View style={styles.budgetBlock}>
                  <View style={styles.budgetBarBg}>
                    <View
                      style={[
                        styles.budgetBarFill,
                        { width: `${pct}%`, backgroundColor: statusColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.budgetText}>
                    {overBudget
                      ? `₹${(spent - stage.budget).toLocaleString('en-IN')} over ₹${stage.budget.toLocaleString('en-IN')} budget`
                      : `₹${(stage.budget - spent).toLocaleString('en-IN')} remaining of ₹${stage.budget.toLocaleString('en-IN')}`}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={onAddExpense} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add Expense to this Stage</Text>
            </TouchableOpacity>

            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Expenses</Text>
              <Text style={styles.listHeaderCount}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <FlatList
              data={transactions}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🧱</Text>
                  <Text style={styles.emptyText}>No expenses tagged to this stage yet</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.txRow}>
                  <View style={styles.txDetails}>
                    <Text style={styles.txMerchant} numberOfLines={1}>
                      {item.merchant}
                    </Text>
                    <Text style={styles.txSub}>
                      {item.category} · {formatDate(item.date)}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                </View>
              )}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  closeBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  topBarTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  heroDescription: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  heroTotal: { color: COLORS.text, fontSize: 34, fontWeight: 'bold' },
  heroSubLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  budgetBlock: { width: '100%', marginTop: 16 },
  budgetBarBg: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetText: { color: COLORS.muted, fontSize: 12, marginTop: 8, textAlign: 'center' },
  addBtn: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listHeaderTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  listHeaderCount: { color: COLORS.muted, fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  txRow: {
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
  txDetails: { flex: 1, marginRight: 8 },
  txMerchant: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  txSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  txAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
  // Edit form
  editForm: { padding: 20 },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  statusChipText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  statusChipTextActive: { color: COLORS.accent },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
});
