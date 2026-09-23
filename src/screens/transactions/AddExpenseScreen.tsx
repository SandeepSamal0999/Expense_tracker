import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { Category, Transaction } from '../../types';
import { useApp } from '../../context/AppContext';
import CategoryPicker from '../../components/CategoryPicker';
import DatePickerModal from '../../components/DatePickerModal';
import { istDateString, istNoonInstant } from '../../utils/dateIST';

export default function AddExpenseScreen({ route, navigation }: any) {
  const existing: Transaction | undefined = route?.params?.transaction;
  const isEdit = !!existing;
  const presetType: 'debit' | 'credit' | undefined = route?.params?.presetType;
  const presetStageId: string | undefined = route?.params?.presetStageId;
  const presetMaterialId: string | undefined = route?.params?.presetMaterialId;
  const presetVendorId: string | undefined = route?.params?.presetVendorId;

  const { state, addExpense, editExpense, deleteExpense } = useApp();
  const [stageId, setStageId] = useState<string | undefined>(existing?.stageId ?? presetStageId);
  const [materialId, setMaterialIdState] = useState<string | undefined>(
    existing?.materialId ?? presetMaterialId,
  );
  const [vendorId, setVendorIdState] = useState<string | undefined>(
    existing?.vendorId ?? presetVendorId,
  );
  const [quantity, setQuantityState] = useState(existing?.quantity ? String(existing.quantity) : '');
  const [unitRate, setUnitRateState] = useState(existing?.unitRate ? String(existing.unitRate) : '');

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [merchant, setMerchant] = useState(existing?.merchant || '');
  const [category, setCategory] = useState<Category>(
    existing?.category || (presetType === 'credit' ? 'Income' : 'Food'),
  );
  const [notes, setNotes] = useState(existing?.notes || '');
  const [txType, setTxType] = useState<'debit' | 'credit'>(
    existing?.type ?? presetType ?? 'debit',
  );
  const [date, setDate] = useState(
    existing ? istDateString(new Date(existing.date)) : istDateString(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const recalcAmount = (qty: string, rate: string) => {
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    if (q > 0 && r > 0) setAmount(String(q * r));
  };

  const setQuantity = (v: string) => {
    setQuantityState(v);
    recalcAmount(v, unitRate);
  };

  const setUnitRate = (v: string) => {
    setUnitRateState(v);
    recalcAmount(quantity, v);
  };

  const selectMaterial = (id: string | undefined) => {
    if (id !== materialId) {
      setQuantityState('');
      setUnitRateState('');
    }
    setMaterialIdState(id);
  };

  const selectVendor = (id: string | undefined) => {
    setVendorIdState(id);
    // Convenience only — never overwrites a merchant name the user already typed.
    if (id && !merchant.trim()) {
      const vendor = state.vendors.find(v => v.id === id);
      if (vendor) setMerchant(vendor.name);
    }
  };

  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!merchant.trim()) {
      Alert.alert('Error', 'Please enter a merchant name');
      return;
    }

    const txn: Transaction = {
      id: existing?.id || Date.now().toString(),
      merchant: merchant.trim(),
      amount: amountNum,
      category,
      date: (() => {
        if (date === istDateString()) return new Date().toISOString(); // exact current time
        // Past date — pin to IST noon so the stored instant doesn't drift
        // to a different IST calendar day regardless of device timezone.
        return istNoonInstant(date).toISOString();
      })(),
      notes: notes.trim(),
      source: existing?.source || 'Manual',
      method: existing?.method || 'Manual',
      type: txType,
      stageId,
      materialId,
      quantity: parseFloat(quantity) || undefined,
      unitRate: parseFloat(unitRate) || undefined,
      vendorId,
    };

    try {
      if (isEdit) {
        await editExpense(txn);
      } else {
        await addExpense(txn);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>
          <View style={{ width: 50 }} />
        </View>

        {existing && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>Source: {existing.source}</Text>
          </View>
        )}

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, txType === 'debit' && styles.typeBtnDebit]}
            onPress={() => {
              setTxType('debit');
              if (category === 'Income') setCategory('Food');
            }}
            activeOpacity={0.8}>
            <Text style={[styles.typeBtnText, txType === 'debit' && styles.typeBtnTextActive]}>
              ↑ Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, txType === 'credit' && styles.typeBtnCredit]}
            onPress={() => {
              setTxType('credit');
              setCategory('Income');
            }}
            activeOpacity={0.8}>
            <Text style={[styles.typeBtnText, txType === 'credit' && styles.typeBtnTextActive]}>
              ↓ Deposit
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={[styles.amountInput, txType === 'credit' && { color: COLORS.accent }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={COLORS.muted}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Merchant</Text>
        <TextInput
          style={styles.input}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="e.g. Swiggy, Amazon"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Category</Text>
        <CategoryPicker selected={category} onSelect={setCategory} />

        {state.vendors.length > 0 && (
          <>
            <Text style={styles.label}>Vendor (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stageChipsRow}>
              <TouchableOpacity
                style={[styles.stageChip, !vendorId && styles.stageChipActive]}
                onPress={() => selectVendor(undefined)}>
                <Text style={[styles.stageChipText, !vendorId && styles.stageChipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {state.vendors.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.stageChip, vendorId === v.id && styles.stageChipActive]}
                  onPress={() => selectVendor(v.id)}>
                  <Text
                    style={[
                      styles.stageChipText,
                      vendorId === v.id && styles.stageChipTextActive,
                    ]}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {state.materials.length > 0 && (
          <>
            <Text style={styles.label}>Material (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stageChipsRow}>
              <TouchableOpacity
                style={[styles.stageChip, !materialId && styles.stageChipActive]}
                onPress={() => selectMaterial(undefined)}>
                <Text style={[styles.stageChipText, !materialId && styles.stageChipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {state.materials.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.stageChip, materialId === m.id && styles.stageChipActive]}
                  onPress={() => selectMaterial(m.id)}>
                  <Text
                    style={[
                      styles.stageChipText,
                      materialId === m.id && styles.stageChipTextActive,
                    ]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {materialId && (
              <View style={styles.qtyRateRow}>
                <View style={styles.qtyRateCol}>
                  <Text style={styles.label}>
                    Quantity ({state.materials.find(m => m.id === materialId)?.unit})
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.qtyRateCol}>
                  <Text style={styles.label}>Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={unitRate}
                    onChangeText={setUnitRate}
                    placeholder="0"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}
          </>
        )}

        {state.stages.length > 0 && (
          <>
            <Text style={styles.label}>Construction Stage (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stageChipsRow}>
              <TouchableOpacity
                style={[styles.stageChip, !stageId && styles.stageChipActive]}
                onPress={() => setStageId(undefined)}>
                <Text style={[styles.stageChipText, !stageId && styles.stageChipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {state.stages.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.stageChip, stageId === s.id && styles.stageChipActive]}
                  onPress={() => setStageId(s.id)}>
                  <Text
                    style={[
                      styles.stageChipText,
                      stageId === s.id && styles.stageChipTextActive,
                    ]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={[styles.label, { marginTop: 20 }]}>Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}>
          <Text style={styles.dateInputText}>
            {new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.dateInputIcon}>📅</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a note..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Update Expense' : 'Add Expense'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>Delete Expense</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={new Date(`${date}T12:00:00`)}
        onSelect={d => {
          setDate(istDateString(d));
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sourceBadge: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  sourceText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeBtnDebit: {
    backgroundColor: COLORS.dangerDim,
    borderColor: COLORS.danger,
  },
  typeBtnCredit: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  typeBtnText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: COLORS.text,
  },
  amountInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.accent,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
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
  notesInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateInputText: {
    color: COLORS.text,
    fontSize: 15,
  },
  dateInputIcon: {
    fontSize: 16,
  },
  stageChipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  qtyRateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  qtyRateCol: {
    flex: 1,
  },
  stageChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stageChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  stageChipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  stageChipTextActive: {
    color: COLORS.accent,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
