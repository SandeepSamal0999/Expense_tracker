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
import VendorDetailModal from '../../components/VendorDetailModal';

export default function VendorsScreen({ navigation }: any) {
  const { state, addVendor } = useApp();
  const { vendors, expenses, vendorPayments } = state;

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const purchasedByVendor = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.vendorId) map[e.vendorId] = (map[e.vendorId] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const paidByVendor = useMemo(() => {
    const map: Record<string, number> = {};
    vendorPayments.forEach(p => (map[p.vendorId] = (map[p.vendorId] || 0) + p.amount));
    return map;
  }, [vendorPayments]);

  const totalPending = useMemo(
    () =>
      vendors.reduce((sum, v) => {
        const pending = (purchasedByVendor[v.id] || 0) - (paidByVendor[v.id] || 0);
        return sum + Math.max(pending, 0);
      }, 0),
    [vendors, purchasedByVendor, paidByVendor],
  );

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) || null;
  const selectedVendorPurchases = useMemo(
    () =>
      selectedVendor
        ? expenses
            .filter(e => e.vendorId === selectedVendor.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [expenses, selectedVendor],
  );

  const handleAddVendor = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }
    await addVendor({
      name: newName.trim(),
      businessName: newBusinessName.trim(),
      phone: newPhone.trim(),
      address: '',
      gstNumber: '',
      notes: '',
    });
    setNewName('');
    setNewBusinessName('');
    setNewPhone('');
    setShowAddVendor(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('House')}>
            <Text style={styles.backBtn}>← House</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Vendors</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Vendors</Text>
            <Text style={styles.summaryValue}>{vendors.length}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Pending</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalPending > 0 ? COLORS.danger : COLORS.success },
              ]}>
              ₹{totalPending.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Vendors</Text>
          <TouchableOpacity onPress={() => setShowAddVendor(true)}>
            <Text style={styles.addLink}>+ Add Vendor</Text>
          </TouchableOpacity>
        </View>

        {vendors.length === 0 ? (
          <Text style={styles.emptyText}>
            No vendors added yet. Tap "+ Add Vendor" to start tracking suppliers and contractors.
          </Text>
        ) : (
          vendors.map(v => {
            const pending = (purchasedByVendor[v.id] || 0) - (paidByVendor[v.id] || 0);
            return (
              <TouchableOpacity
                key={v.id}
                style={styles.vendorCard}
                onPress={() => setSelectedVendorId(v.id)}
                activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{v.name}</Text>
                  <Text style={styles.vendorSub}>
                    {v.businessName || 'No business name'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.pendingBadge,
                    { color: pending > 0 ? COLORS.danger : COLORS.muted },
                  ]}>
                  {pending > 0 ? `₹${pending.toLocaleString('en-IN')} due` : 'Settled'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <VendorDetailModal
        visible={!!selectedVendor}
        vendor={selectedVendor}
        purchases={selectedVendorPurchases}
        onClose={() => setSelectedVendorId(null)}
        onAddPurchase={() => {
          if (selectedVendor) {
            navigation.navigate('Transactions', {
              screen: 'AddExpense',
              params: { presetVendorId: selectedVendor.id },
            });
          }
        }}
      />

      <Modal
        visible={showAddVendor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddVendor(false)}>
        <View style={styles.overlay}>
          <View style={styles.addModal}>
            <Text style={styles.addModalTitle}>Add Vendor</Text>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Name"
              placeholderTextColor={COLORS.muted}
            />
            <TextInput
              style={styles.addInput}
              value={newBusinessName}
              onChangeText={setNewBusinessName}
              placeholder="Business name (optional)"
              placeholderTextColor={COLORS.muted}
            />
            <TextInput
              style={styles.addInput}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Phone (optional)"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
            <View style={styles.addActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddVendor(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddVendor}>
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
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  addLink: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  emptyText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  vendorCard: {
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
  vendorName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  vendorSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  pendingBadge: { fontSize: 12, fontWeight: '700' },
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
