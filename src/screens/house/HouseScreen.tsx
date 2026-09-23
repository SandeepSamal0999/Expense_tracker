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
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { ConstructionStage, StageStatus } from '../../types';
import HouseSetupScreen from './HouseSetupScreen';
import StageDetailModal from '../../components/StageDetailModal';

const STATUS_LABEL: Record<StageStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const STATUS_OPTIONS: { value: StageStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function HouseScreen({ navigation }: any) {
  const { state, addStage, updateStage, reorderStages } = useApp();
  const { house, stages, expenses, workers, materials, vendors } = state;

  const [editingHouse, setEditingHouse] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const spentByStage = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.stageId) map[e.stageId] = (map[e.stageId] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );

  const totalSpent = useMemo(
    () => sortedStages.reduce((s, st) => s + (spentByStage[st.id] || 0), 0),
    [sortedStages, spentByStage],
  );

  const activeWorkerCount = useMemo(
    () => workers.filter(w => w.status === 'active').length,
    [workers],
  );

  if (!house) {
    return <HouseSetupScreen onBack={() => navigation.navigate('Dashboard')} />;
  }
  if (editingHouse) {
    return <HouseSetupScreen existing={house} onBack={() => setEditingHouse(false)} />;
  }

  const remaining = house.budget - totalSpent;
  const utilizationPct = house.budget > 0 ? (totalSpent / house.budget) * 100 : 0;
  const overBudget = totalSpent > house.budget;
  const budgetColor = overBudget ? COLORS.danger : utilizationPct >= 80 ? COLORS.warning : COLORS.success;

  const selectedStage = sortedStages.find(s => s.id === selectedStageId) || null;
  const selectedStageTxns = selectedStage
    ? expenses.filter(e => e.stageId === selectedStage.id).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    : [];

  const moveStage = (id: string, direction: 'up' | 'down') => {
    const idx = sortedStages.findIndex(s => s.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedStages.length) return;
    const reordered = [...sortedStages];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    reorderStages(reordered.map((s, i) => ({ ...s, order: i })));
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    await addStage(newStageName);
    setNewStageName('');
    setShowAddStage(false);
  };

  const openAddExpense = (stage?: ConstructionStage) => {
    navigation.navigate('Transactions', {
      screen: 'AddExpense',
      params: stage ? { presetStageId: stage.id } : undefined,
    });
  };

  const handleChangeStatus = (stage: ConstructionStage) => {
    Alert.alert(
      stage.name,
      'Change status',
      STATUS_OPTIONS.map(opt => ({
        text: opt.label,
        onPress: () => updateStage(stage.id, { status: opt.value }),
      })).concat([{ text: 'Cancel', style: 'cancel' } as any]),
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerDecor} pointerEvents="none">
            <View style={styles.decorSun} />
            <View style={styles.decorHillBack} />
            <View style={styles.decorHillFront} />
          </View>

          <View style={styles.headerTopRow}>
            <View style={styles.headerTextCol}>
              <Text style={styles.title} numberOfLines={1}>
                {house.name} 🏠
              </Text>
              {!!house.location && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.subtitle}>{house.location}</Text>
                </View>
              )}
              {!!house.tagline && (
                <Text style={styles.tagline} numberOfLines={2}>
                  "{house.tagline}"
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditingHouse(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.houseIllustration}>🏡</Text>
        </View>

        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <View style={styles.budgetCol}>
              <View style={styles.budgetIconWrap}>
                <Text style={styles.budgetIconText}>👛</Text>
              </View>
              <View>
                <Text style={styles.budgetLabel}>Total Budget</Text>
                <Text style={styles.budgetValue}>₹{house.budget.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetLabel}>Total Spent</Text>
              <Text style={[styles.budgetValue, { color: budgetColor }]}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.budgetBarBg}>
            <View
              style={[
                styles.budgetBarFill,
                { width: `${Math.min(utilizationPct, 100)}%`, backgroundColor: budgetColor },
              ]}
            />
          </View>
          <View style={styles.budgetFooterRow}>
            <Text style={styles.budgetFooterText}>{utilizationPct.toFixed(1)}% used</Text>
            <Text style={styles.budgetFooterText}>
              {overBudget
                ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`
                : `₹${remaining.toLocaleString('en-IN')} remaining`}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#FFE8D6' }]}
            onPress={() => navigation.navigate('Workers')}
            activeOpacity={0.85}>
            <View style={styles.statTop}>
              <View style={styles.statIconWrap}>
                <Text style={styles.statIconText}>👷</Text>
              </View>
              <Text style={styles.statChevron}>›</Text>
            </View>
            <Text style={styles.statTitle}>Workers</Text>
            <Text style={styles.statValue}>{activeWorkerCount}</Text>
            <Text style={styles.statLabel}>active workers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#DCEBFF' }]}
            onPress={() => navigation.navigate('Materials')}
            activeOpacity={0.85}>
            <View style={styles.statTop}>
              <View style={styles.statIconWrap}>
                <Text style={styles.statIconText}>🧱</Text>
              </View>
              <Text style={styles.statChevron}>›</Text>
            </View>
            <Text style={styles.statTitle}>Materials</Text>
            <Text style={styles.statValue}>{materials.length}</Text>
            <Text style={styles.statLabel}>items tracked</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#EDE1FB' }]}
            onPress={() => navigation.navigate('Vendors')}
            activeOpacity={0.85}>
            <View style={styles.statTop}>
              <View style={styles.statIconWrap}>
                <Text style={styles.statIconText}>🏢</Text>
              </View>
              <Text style={styles.statChevron}>›</Text>
            </View>
            <Text style={styles.statTitle}>Vendors</Text>
            <Text style={styles.statValue}>{vendors.length}</Text>
            <Text style={styles.statLabel}>tracked</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionIcon}>🗂️</Text>
            <View>
              <Text style={styles.sectionTitle}>Construction Stages</Text>
              <Text style={styles.sectionSubtitle}>Track progress, manage expenses</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addStageBtn}
            onPress={() => setShowAddStage(true)}
            activeOpacity={0.85}>
            <Text style={styles.addStageBtnText}>+ Add Stage</Text>
          </TouchableOpacity>
        </View>

        {sortedStages.map((stage, index) => {
          const spent = spentByStage[stage.id] || 0;
          const hasBudget = stage.budget > 0;
          const pct = hasBudget ? Math.min((spent / stage.budget) * 100, 100) : 0;
          const stageOver = hasBudget && spent > stage.budget;
          const stageColor = stageOver ? COLORS.danger : pct >= 80 ? COLORS.warning : COLORS.success;
          const isFirst = index === 0;
          const isLast = index === sortedStages.length - 1;

          return (
            <View key={stage.id} style={styles.stageCard}>
              <View style={styles.stageTopRow}>
                <TouchableOpacity
                  style={styles.stageTitleArea}
                  onPress={() => setSelectedStageId(stage.id)}
                  activeOpacity={0.8}>
                  <View style={styles.stageNumberBadge}>
                    <Text style={styles.stageNumberText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageName} numberOfLines={1}>
                      {stage.name}
                    </Text>
                    {!!stage.description && (
                      <Text style={styles.stageDescription} numberOfLines={1}>
                        {stage.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusPill,
                    { backgroundColor: stageColor + '18', borderColor: stageColor + '50' },
                  ]}
                  onPress={() => handleChangeStatus(stage)}
                  activeOpacity={0.8}>
                  <Text style={[styles.statusPillText, { color: stageColor }]}>
                    {STATUS_LABEL[stage.status]} ⌄
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setSelectedStageId(stage.id)} activeOpacity={0.8}>
                <View style={styles.stageAmountsRow}>
                  <View>
                    <Text style={[styles.stageAmountValue, { color: COLORS.success }]}>
                      ₹{spent.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.stageAmountLabel}>spent</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.stageAmountValue}>
                      {hasBudget ? `₹${stage.budget.toLocaleString('en-IN')}` : '--'}
                    </Text>
                    <Text style={styles.stageAmountLabel}>of budget</Text>
                  </View>
                </View>

                <View style={styles.stageBarBg}>
                  <View
                    style={[
                      styles.stageBarFill,
                      { width: `${pct}%`, backgroundColor: stageColor },
                    ]}
                  />
                </View>
                <View style={styles.stageProgressRow}>
                  <Text style={styles.stageProgressText}>{Math.round(pct)}%</Text>
                  <Text style={styles.stageProgressText}>Complete</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.reorderRow}>
                <TouchableOpacity
                  style={[styles.reorderBtn, isFirst && styles.reorderBtnDisabled]}
                  onPress={() => moveStage(stage.id, 'up')}
                  disabled={isFirst}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text
                    style={[styles.reorderBtnText, isFirst && styles.reorderBtnTextDisabled]}>
                    ↑ Move Up
                  </Text>
                </TouchableOpacity>
                <View style={styles.reorderDivider} />
                <TouchableOpacity
                  style={[styles.reorderBtn, isLast && styles.reorderBtnDisabled]}
                  onPress={() => moveStage(stage.id, 'down')}
                  disabled={isLast}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={[styles.reorderBtnText, isLast && styles.reorderBtnTextDisabled]}>
                    ↓ Move Down
                  </Text>
                </TouchableOpacity>
                <View style={styles.reorderDivider} />
                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={() => setSelectedStageId(stage.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.viewDetailsText}>View Details ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openAddExpense()}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <StageDetailModal
        visible={!!selectedStage}
        stage={selectedStage}
        transactions={selectedStageTxns}
        onClose={() => setSelectedStageId(null)}
        onAddExpense={() => {
          if (selectedStage) openAddExpense(selectedStage);
        }}
      />

      <Modal
        visible={showAddStage}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStage(false)}>
        <View style={styles.overlay}>
          <View style={styles.addStageModal}>
            <Text style={styles.addStageTitle}>Add Stage</Text>
            <TextInput
              style={styles.addStageInput}
              value={newStageName}
              onChangeText={setNewStageName}
              placeholder="e.g. Interior Woodwork"
              placeholderTextColor={COLORS.muted}
              autoFocus
            />
            <View style={styles.addStageActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddStage(false);
                  setNewStageName('');
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddStage}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// react-native's SafeAreaView is a no-op on Android, so pad manually for the status bar.
const TOP_PADDING = (StatusBar.currentHeight || 0) + 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingTop: TOP_PADDING, paddingBottom: 90 },
  // Header
  headerCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
    backgroundColor: '#EAF6EF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  headerDecor: { ...StyleSheet.absoluteFillObject },
  decorSun: {
    position: 'absolute',
    top: -20,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD98A',
    opacity: 0.9,
  },
  decorHillBack: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 180,
    height: 70,
    borderRadius: 60,
    backgroundColor: '#CFE7D6',
  },
  decorHillFront: {
    position: 'absolute',
    bottom: -38,
    right: -10,
    width: 200,
    height: 80,
    borderRadius: 70,
    backgroundColor: '#BFE0C8',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  headerTextCol: { flexShrink: 1, maxWidth: '62%' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationIcon: { fontSize: 11 },
  subtitle: { color: COLORS.muted, fontSize: 13 },
  tagline: {
    color: COLORS.muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 2,
  },
  editBtnText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  houseIllustration: {
    position: 'absolute',
    bottom: 2,
    right: 10,
    fontSize: 64,
    zIndex: 1,
  },
  // Budget card
  budgetCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.successDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetIconText: { fontSize: 18 },
  budgetLabel: { color: COLORS.muted, fontSize: 12 },
  budgetValue: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  budgetBarBg: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetFooterText: { color: COLORS.muted, fontSize: 12 },
  // Quick-stat row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 14, padding: 12 },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: { fontSize: 14 },
  statChevron: { color: COLORS.muted, fontSize: 16, fontWeight: '700' },
  statTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  sectionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  addStageBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addStageBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Stage cards
  stageCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  stageTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  stageTitleArea: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  stageNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.successDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  stageName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  stageDescription: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  statusPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  stageAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stageAmountValue: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  stageAmountLabel: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  stageBarBg: {
    height: 5,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  stageBarFill: { height: '100%', borderRadius: 3 },
  stageProgressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stageProgressText: { color: COLORS.muted, fontSize: 11 },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    marginTop: 12,
    paddingTop: 10,
  },
  reorderDivider: { width: 1, height: 16, backgroundColor: COLORS.cardBorder },
  reorderBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  reorderBtnDisabled: { opacity: 0.3 },
  reorderBtnText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  reorderBtnTextDisabled: { color: COLORS.muted },
  viewDetailsText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
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
  fabText: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: -2 },
  // Add-stage modal
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  addStageModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  addStageTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  addStageInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 15,
    padding: 14,
    marginBottom: 20,
  },
  addStageActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.muted, fontSize: 15 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
