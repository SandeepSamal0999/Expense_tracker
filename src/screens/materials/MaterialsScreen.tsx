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
import { UNIT_OPTIONS } from '../../services/materialService';
import MaterialDetailModal from '../../components/MaterialDetailModal';

export default function MaterialsScreen({ navigation }: any) {
  const { state, addMaterial } = useApp();
  const { materials, expenses } = state;

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState(UNIT_OPTIONS[0]);
  const [newNotes, setNewNotes] = useState('');

  const spentByMaterial = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.materialId) map[e.materialId] = (map[e.materialId] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const purchaseCountByMaterial = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.materialId) map[e.materialId] = (map[e.materialId] || 0) + 1;
    });
    return map;
  }, [expenses]);

  const totalSpent = useMemo(
    () => materials.reduce((s, m) => s + (spentByMaterial[m.id] || 0), 0),
    [materials, spentByMaterial],
  );

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || null;
  const selectedMaterialPurchases = useMemo(
    () =>
      selectedMaterial
        ? expenses
            .filter(e => e.materialId === selectedMaterial.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [expenses, selectedMaterial],
  );

  const handleAddMaterial = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a material name');
      return;
    }
    await addMaterial({ name: newName.trim(), unit: newUnit, notes: newNotes.trim() });
    setNewName('');
    setNewUnit(UNIT_OPTIONS[0]);
    setNewNotes('');
    setShowAddMaterial(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('House')}>
            <Text style={styles.backBtn}>← House</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Materials</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Material Spending</Text>
          <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Materials</Text>
          <TouchableOpacity onPress={() => setShowAddMaterial(true)}>
            <Text style={styles.addLink}>+ Add Material</Text>
          </TouchableOpacity>
        </View>

        {materials.length === 0 ? (
          <Text style={styles.emptyText}>
            No materials added yet. Tap "+ Add Material" to start tracking cement, steel, bricks,
            etc.
          </Text>
        ) : (
          materials.map(m => {
            const spent = spentByMaterial[m.id] || 0;
            const count = purchaseCountByMaterial[m.id] || 0;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.materialCard}
                onPress={() => setSelectedMaterialId(m.id)}
                activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialName}>{m.name}</Text>
                  <Text style={styles.materialSub}>
                    {count} purchase{count !== 1 ? 's' : ''} · tracked in {m.unit}
                  </Text>
                </View>
                <Text style={styles.materialAmount}>₹{spent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <MaterialDetailModal
        visible={!!selectedMaterial}
        material={selectedMaterial}
        purchases={selectedMaterialPurchases}
        onClose={() => setSelectedMaterialId(null)}
        onAddPurchase={() => {
          if (selectedMaterial) {
            navigation.navigate('Transactions', {
              screen: 'AddExpense',
              params: { presetMaterialId: selectedMaterial.id },
            });
          }
        }}
      />

      <Modal
        visible={showAddMaterial}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMaterial(false)}>
        <View style={styles.overlay}>
          <View style={styles.addModal}>
            <Text style={styles.addModalTitle}>Add Material</Text>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Cement, Steel Rods, Bricks"
              placeholderTextColor={COLORS.muted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitRow}>
              {UNIT_OPTIONS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, newUnit === u && styles.unitChipActive]}
                  onPress={() => setNewUnit(u)}>
                  <Text style={[styles.unitChipText, newUnit === u && styles.unitChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.addInput}
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.muted}
            />
            <View style={styles.addActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddMaterial(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMaterial}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  // react-native's SafeAreaView is a no-op on Android, so pad manually for the status bar.
  content: {
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  addLink: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  emptyText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  materialCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  materialName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  materialSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  materialAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  addModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  addModalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  addInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 15,
    padding: 14,
    marginBottom: 12,
  },
  unitRow: { flexDirection: 'row', marginBottom: 12 },
  unitChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  unitChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  unitChipText: { color: COLORS.muted, fontSize: 13 },
  unitChipTextActive: { color: COLORS.accent },
  addActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
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
