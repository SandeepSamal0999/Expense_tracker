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

export default function AddExpenseScreen({ route, navigation }: any) {
  const existing: Transaction | undefined = route?.params?.transaction;
  const isEdit = !!existing;

  const { addExpense, editExpense, deleteExpense } = useApp();

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [merchant, setMerchant] = useState(existing?.merchant || '');
  const [category, setCategory] = useState<Category>(existing?.category || 'Food');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [date, setDate] = useState(
    existing ? existing.date.split('T')[0] : new Date().toISOString().split('T')[0],
  );

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
      date: new Date(date).toISOString(),
      notes: notes.trim(),
      source: existing?.source || 'Manual',
      method: existing?.method || 'Manual',
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

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.amountInput}
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

        <Text style={[styles.label, { marginTop: 20 }]}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.muted}
        />

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
