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
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { House, HouseStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import DatePickerModal from '../../components/DatePickerModal';

const STATUS_OPTIONS: { value: HouseStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

interface Props {
  existing?: House;
  onBack: () => void;
}

export default function HouseSetupScreen({ existing, onBack }: Props) {
  const { setupHouse, updateHouse } = useApp();
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [tagline, setTagline] = useState(existing?.tagline || '');
  const [budget, setBudget] = useState(existing ? String(existing.budget) : '');
  const [status, setStatus] = useState<HouseStatus>(existing?.status || 'planning');
  const [startDate, setStartDate] = useState(existing?.startDate || new Date().toISOString());
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    existing?.expectedCompletionDate || new Date().toISOString(),
  );
  const [pickingDate, setPickingDate] = useState<'start' | 'end' | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a house/project name');
      return;
    }
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) {
      Alert.alert('Error', 'Please enter a valid budget');
      return;
    }

    const house: House = {
      name: name.trim(),
      location: location.trim(),
      startDate,
      expectedCompletionDate,
      status,
      budget: budgetNum,
      tagline: tagline.trim(),
    };

    if (isEdit) {
      await updateHouse(house);
    } else {
      await setupHouse(house);
    }
    onBack();
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit House' : 'Set Up House'}</Text>
          <View style={{ width: 50 }} />
        </View>

        {!isEdit && (
          <Text style={styles.intro}>
            Track your house construction budget, stages, and spending separately from your
            regular expenses.
          </Text>
        )}

        <Text style={styles.label}>House / Project Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. My House"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Bengaluru"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Tagline / Quote (optional)</Text>
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="e.g. Building today, a better tomorrow"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Estimated Construction Budget (₹)</Text>
        <TextInput
          style={styles.input}
          value={budget}
          onChangeText={setBudget}
          placeholder="e.g. 3200000"
          placeholderTextColor={COLORS.muted}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setPickingDate('start')}
          activeOpacity={0.8}>
          <Text style={styles.dateInputText}>{fmt(startDate)}</Text>
          <Text style={styles.dateInputIcon}>📅</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Expected Completion Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setPickingDate('end')}
          activeOpacity={0.8}>
          <Text style={styles.dateInputText}>{fmt(expectedCompletionDate)}</Text>
          <Text style={styles.dateInputIcon}>📅</Text>
        </TouchableOpacity>

        {isEdit && (
          <>
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
          </>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create House'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={pickingDate !== null}
        value={new Date(pickingDate === 'start' ? startDate : expectedCompletionDate)}
        allowFuture
        onSelect={d => {
          if (pickingDate === 'start') setStartDate(d.toISOString());
          else setExpectedCompletionDate(d.toISOString());
          setPickingDate(null);
        }}
        onClose={() => setPickingDate(null)}
      />
    </KeyboardAvoidingView>
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
    marginBottom: 20,
  },
  backBtn: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  intro: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
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
  dateInputText: { color: COLORS.text, fontSize: 15 },
  dateInputIcon: { fontSize: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  statusChipText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  statusChipTextActive: { color: COLORS.accent },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
