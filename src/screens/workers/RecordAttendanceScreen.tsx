import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, WorkerAttendance } from '../../types';
import DatePickerModal from '../../components/DatePickerModal';
import { istDateString } from '../../utils/dateIST';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; mult: number }[] = [
  { value: 'full_day', label: 'Full Day', mult: 1 },
  { value: 'half_day', label: 'Half Day', mult: 0.5 },
  { value: 'absent', label: 'Absent', mult: 0 },
  { value: 'holiday', label: 'Holiday', mult: 0 },
];

interface Props {
  onBack: () => void;
}

export default function RecordAttendanceScreen({ onBack }: Props) {
  const { state, recordAttendanceBatch } = useApp();
  const activeWorkers = useMemo(() => state.workers.filter(w => w.status === 'active'), [state.workers]);

  const loadForDate = (d: string) => {
    const status: Record<string, AttendanceStatus | undefined> = {};
    const amount: Record<string, string> = {};
    state.workerAttendance
      .filter(a => a.date === d)
      .forEach(a => {
        status[a.workerId] = a.status;
        amount[a.workerId] = String(a.amount);
      });
    return { status, amount };
  };

  const [date, setDate] = useState(istDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stageId, setStageId] = useState<string | undefined>(undefined);
  const initial = useMemo(() => loadForDate(istDateString()), []);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus | undefined>>(
    initial.status,
  );
  const [amountMap, setAmountMap] = useState<Record<string, string>>(initial.amount);

  const handleDateChange = (d: string) => {
    setDate(d);
    const loaded = loadForDate(d);
    setStatusMap(loaded.status);
    setAmountMap(loaded.amount);
  };

  const selectStatus = (workerId: string, dailyWage: number, opt: (typeof STATUS_OPTIONS)[number]) => {
    setStatusMap(prev => {
      const isDeselecting = prev[workerId] === opt.value;
      return { ...prev, [workerId]: isDeselecting ? undefined : opt.value };
    });
    setAmountMap(prev => {
      if (statusMap[workerId] === opt.value) return prev; // deselecting — leave amount as-is
      return { ...prev, [workerId]: String(dailyWage * opt.mult) };
    });
  };

  const totalToday = activeWorkers.reduce((sum, w) => {
    if (!statusMap[w.id]) return sum;
    return sum + (parseFloat(amountMap[w.id]) || 0);
  }, 0);

  const handleSave = async () => {
    const entries: WorkerAttendance[] = activeWorkers
      .filter(w => statusMap[w.id])
      .map(w => ({
        id: `${w.id}_${date}`,
        workerId: w.id,
        date,
        status: statusMap[w.id]!,
        stageId,
        amount: parseFloat(amountMap[w.id]) || 0,
      }));

    if (entries.length === 0) {
      Alert.alert('Nothing to save', "Mark at least one worker's attendance first.");
      return;
    }

    await recordAttendanceBatch(entries);
    onBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Record Attendance</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={styles.label}>Date</Text>
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

        <Text style={[styles.label, { marginTop: 20 }]}>Workers</Text>
        <Text style={styles.hint}>Tap a status, then edit the amount for a custom rate if needed.</Text>
        {activeWorkers.length === 0 ? (
          <Text style={styles.emptyText}>No active workers yet. Add one first.</Text>
        ) : (
          activeWorkers.map(w => (
            <View key={w.id} style={styles.workerRow}>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{w.name}</Text>
                <Text style={styles.workerRole}>{w.role}</Text>
              </View>
              <View style={styles.statusChips}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusChip,
                      statusMap[w.id] === opt.value && styles.statusChipActive,
                    ]}
                    onPress={() => selectStatus(w.id, w.dailyWage, opt)}>
                    <Text
                      style={[
                        styles.statusChipText,
                        statusMap[w.id] === opt.value && styles.statusChipTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {statusMap[w.id] && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Amount (₹)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountMap[w.id] ?? ''}
                    onChangeText={v => setAmountMap(prev => ({ ...prev, [w.id]: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Labour for this Day</Text>
          <Text style={styles.totalValue}>₹{totalToday.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Attendance</Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={new Date(`${date}T12:00:00`)}
        onSelect={d => {
          handleDateChange(istDateString(d));
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
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
    marginBottom: 20,
  },
  backBtn: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  hint: { color: COLORS.muted, fontSize: 12, marginBottom: 12, marginLeft: 4 },
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
    marginBottom: 16,
  },
  dateInputText: { color: COLORS.text, fontSize: 15 },
  dateInputIcon: { fontSize: 16 },
  stageChipsRow: { gap: 8, paddingRight: 4, marginBottom: 4 },
  stageChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stageChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  stageChipText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  stageChipTextActive: { color: COLORS.accent },
  emptyText: { color: COLORS.muted, fontSize: 13, marginTop: 8 },
  workerRow: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  workerInfo: { marginBottom: 10 },
  workerName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  workerRole: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  statusChips: { flexDirection: 'row', gap: 6 },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
  },
  statusChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  statusChipText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  statusChipTextActive: { color: COLORS.accent },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  amountLabel: { color: COLORS.muted, fontSize: 12 },
  amountInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: COLORS.text,
    fontSize: 14,
    minWidth: 90,
    textAlign: 'right',
  },
  totalCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  totalLabel: { color: COLORS.muted, fontSize: 12 },
  totalValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
