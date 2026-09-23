import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Transaction, Vendor } from '../types';
import { useApp } from '../context/AppContext';
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
  vendor: Vendor | null;
  purchases: Transaction[]; // already filtered to this vendor, newest first
  onClose: () => void;
  onAddPurchase: () => void;
}

export default function VendorDetailModal({
  visible,
  vendor,
  purchases,
  onClose,
  onAddPurchase,
}: Props) {
  const { state, updateVendor, deleteVendor, addVendorPayment, deleteVendorPayment } = useApp();
  const [editing, setEditing] = useState(false);
  const [payingMode, setPayingMode] = useState(false);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  if (!vendor) return null;

  const payments = state.vendorPayments
    .filter(p => p.vendorId === vendor.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const purchased = purchases.reduce((s, p) => s + p.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = purchased - paid;

  const startEdit = () => {
    setName(vendor.name);
    setBusinessName(vendor.businessName);
    setPhone(vendor.phone);
    setAddress(vendor.address);
    setGstNumber(vendor.gstNumber);
    setNotes(vendor.notes);
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    await updateVendor(vendor.id, {
      name: name.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gstNumber: gstNumber.trim(),
      notes: notes.trim(),
    });
    setEditing(false);
  };

  const handleDeleteVendor = () => {
    Alert.alert(
      'Delete Vendor',
      `Delete ${vendor.name}? Their payment history will also be removed (past purchases keep their amount but lose the vendor link).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVendor(vendor.id);
            setEditing(false);
            onClose();
          },
        },
      ],
    );
  };

  const startPayment = () => {
    setPayAmount(pending > 0 ? String(pending) : '');
    setPayNotes('');
    setPayingMode(true);
  };

  const handleSavePayment = async () => {
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await addVendorPayment({
      vendorId: vendor.id,
      date: new Date().toISOString(),
      amount: amountNum,
      notes: payNotes.trim(),
    });
    setPayingMode(false);
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert('Delete Payment', 'Remove this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVendorPayment(id) },
    ]);
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
          <TouchableOpacity
            onPress={() => {
              setEditing(false);
              setPayingMode(false);
              onClose();
            }}
            style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Vendor</Text>
          <TouchableOpacity
            onPress={() => (editing ? setEditing(false) : startEdit())}
            style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{editing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <ScrollView contentContainerStyle={styles.editForm}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Business Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
            />
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Address (optional)</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            <Text style={styles.label}>GST Number (optional)</Text>
            <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteVendor}>
              <Text style={styles.deleteBtnText}>Delete Vendor</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : payingMode ? (
          <ScrollView contentContainerStyle={styles.editForm}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.input} value={payNotes} onChangeText={setPayNotes} />
            <Text style={styles.hint}>
              Pending before this payment: ₹{Math.max(pending, 0).toLocaleString('en-IN')}
            </Text>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayment}>
              <Text style={styles.saveBtnText}>Save Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayingMode(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Text style={styles.heroName}>{vendor.name}</Text>
              {!!vendor.businessName && (
                <Text style={styles.heroRole}>{vendor.businessName}</Text>
              )}

              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Purchased</Text>
                  <Text style={styles.summaryValue}>₹{purchased.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Paid</Text>
                  <Text style={styles.summaryValue}>₹{paid.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Pending</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: pending > 0 ? COLORS.danger : COLORS.success },
                    ]}>
                    ₹{Math.abs(pending).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.payBtn} onPress={startPayment} activeOpacity={0.85}>
                  <Text style={styles.payBtnText}>💸 Record Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={onAddPurchase} activeOpacity={0.85}>
                  <Text style={styles.addBtnText}>+ Add Purchase</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Purchase History</Text>
            {purchases.length === 0 ? (
              <Text style={styles.emptyText}>No purchases recorded yet.</Text>
            ) : (
              purchases.map(p => (
                <View key={p.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPrimary} numberOfLines={1}>
                      {p.merchant}
                    </Text>
                    <Text style={styles.historySub}>{formatDate(p.date)}</Text>
                  </View>
                  <Text style={styles.historyAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History</Text>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No payments recorded yet.</Text>
            ) : (
              payments.map(p => (
                <View key={p.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPrimary}>{formatDate(p.date)}</Text>
                    {!!p.notes && <Text style={styles.historySub}>{p.notes}</Text>}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyAmount, { color: COLORS.success }]}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeletePayment(p.id)}>
                      <Text style={styles.deleteLink}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  heroRole: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
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
  summaryValue: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginTop: 4 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 16, alignSelf: 'stretch' },
  payBtn: {
    flex: 1,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  addBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  emptyText: { color: COLORS.muted, fontSize: 13, marginBottom: 8 },
  historyRow: {
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
  historyLeft: { flex: 1, marginRight: 8 },
  historyPrimary: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  historySub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  deleteLink: { color: COLORS.danger, fontSize: 11, fontWeight: '600' },
  // Edit / payment forms
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
  hint: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
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
