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
import { Material, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { UNIT_OPTIONS } from '../services/materialService';
import { istRelativeDayLabel } from '../utils/dateIST';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    istRelativeDayLabel(d) ??
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  );
}

interface Props {
  visible: boolean;
  material: Material | null;
  purchases: Transaction[]; // already filtered to this material, newest first
  onClose: () => void;
  onAddPurchase: () => void;
}

export default function MaterialDetailModal({
  visible,
  material,
  purchases,
  onClose,
  onAddPurchase,
}: Props) {
  const { updateMaterial, deleteMaterial } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');

  if (!material) return null;

  const totalSpent = purchases.reduce((s, p) => s + p.amount, 0);
  const totalQuantity = purchases.reduce((s, p) => s + (p.quantity || 0), 0);
  const avgRate = totalQuantity > 0 ? totalSpent / totalQuantity : 0;

  const startEdit = () => {
    setName(material.name);
    setUnit(material.unit);
    setNotes(material.notes);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a material name');
      return;
    }
    await updateMaterial(material.id, { name: name.trim(), unit, notes: notes.trim() });
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Material',
      `Delete "${material.name}"? Past purchases will keep their amount but lose the material link.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMaterial(material.id);
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
          <Text style={styles.topBarTitle}>Material</Text>
          <TouchableOpacity
            onPress={() => (editing ? setEditing(false) : startEdit())}
            style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{editing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Material Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Unit</Text>
            <View style={styles.unitRow}>
              {UNIT_OPTIONS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}>
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Material</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroName}>{material.name}</Text>
              <Text style={styles.heroUnit}>Tracked in {material.unit}</Text>
              <Text style={styles.heroTotal}>₹{totalSpent.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroSubLabel}>TOTAL SPENT</Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Quantity</Text>
                  <Text style={styles.summaryValue}>
                    {totalQuantity.toLocaleString('en-IN')} {material.unit}
                  </Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Purchases</Text>
                  <Text style={styles.summaryValue}>{purchases.length}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Avg Rate</Text>
                  <Text style={styles.summaryValue}>
                    {avgRate > 0 ? `₹${avgRate.toFixed(0)}` : '—'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={onAddPurchase} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add Purchase</Text>
            </TouchableOpacity>

            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Price History</Text>
              <Text style={styles.listHeaderCount}>
                {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <FlatList
              data={purchases}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🧱</Text>
                  <Text style={styles.emptyText}>No purchases recorded yet</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.txRow}>
                  <View style={styles.txDetails}>
                    <Text style={styles.txMerchant} numberOfLines={1}>
                      {item.merchant}
                    </Text>
                    <Text style={styles.txSub}>
                      {formatDate(item.date)}
                      {item.quantity ? ` · ${item.quantity} ${material.unit}` : ''}
                      {item.unitRate ? ` · ₹${item.unitRate}/${material.unit}` : ''}
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
  heroUnit: { color: COLORS.muted, fontSize: 12, marginTop: 4, marginBottom: 10 },
  heroTotal: { color: COLORS.text, fontSize: 34, fontWeight: 'bold' },
  heroSubLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  summaryCol: { alignItems: 'center', flex: 1 },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
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
  emptyText: { color: COLORS.muted, fontSize: 14 },
  // Edit form
  editForm: { padding: 20 },
  label: { color: COLORS.muted, fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
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
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  unitChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  unitChipText: { color: COLORS.muted, fontSize: 13 },
  unitChipTextActive: { color: COLORS.accent },
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
