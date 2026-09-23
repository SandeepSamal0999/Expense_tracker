import React, { useMemo, useState } from 'react';
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
import { AttendanceStatus, Worker, WorkerStatus } from '../types';
import { useApp } from '../context/AppContext';
import { ROLE_OPTIONS } from '../services/workerService';
import { istRelativeDayLabel } from '../utils/dateIST';

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  full_day: 'Full Day',
  half_day: 'Half Day',
  absent: 'Absent',
  holiday: 'Holiday',
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
  worker: Worker | null;
  onClose: () => void;
}

export default function WorkerDetailModal({ visible, worker, onClose }: Props) {
  const {
    state,
    updateWorker,
    deleteWorker,
    addWorkerPayment,
    deleteWorkerPayment,
    addWorkerFixedJob,
    deleteWorkerFixedJob,
  } = useApp();
  const [editing, setEditing] = useState(false);
  const [payingMode, setPayingMode] = useState(false);
  const [addingJob, setAddingJob] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [status, setStatus] = useState<WorkerStatus>('active');
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobAmount, setJobAmount] = useState('');

  if (!worker) return null;

  const attendance = useMemo(
    () =>
      state.workerAttendance
        .filter(a => a.workerId === worker.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.workerAttendance, worker.id],
  );
  const payments = useMemo(
    () =>
      state.workerPayments
        .filter(p => p.workerId === worker.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.workerPayments, worker.id],
  );
  const fixedJobs = useMemo(
    () =>
      state.workerFixedJobs
        .filter(j => j.workerId === worker.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.workerFixedJobs, worker.id],
  );

  const earned =
    attendance.reduce((s, a) => s + a.amount, 0) + fixedJobs.reduce((s, j) => s + j.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = earned - paid;

  const stageName = (stageId?: string) =>
    stageId ? state.stages.find(s => s.id === stageId)?.name : undefined;

  const startEdit = () => {
    setName(worker.name);
    setRole(worker.role);
    setPhone(worker.phone);
    setDailyWage(String(worker.dailyWage));
    setStatus(worker.status);
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    const wageNum = parseFloat(dailyWage);
    if (!wageNum || wageNum <= 0) {
      Alert.alert('Error', 'Please enter a valid daily wage');
      return;
    }
    await updateWorker(worker.id, {
      name: name.trim(),
      role: role.trim() || 'Other',
      phone: phone.trim(),
      dailyWage: wageNum,
      status,
    });
    setEditing(false);
  };

  const handleDeleteWorker = () => {
    Alert.alert(
      'Delete Worker',
      `Delete ${worker.name}? Their attendance and payment history will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorker(worker.id);
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
    await addWorkerPayment({
      workerId: worker.id,
      date: new Date().toISOString(),
      amount: amountNum,
      notes: payNotes.trim(),
    });
    setPayingMode(false);
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert('Delete Payment', 'Remove this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWorkerPayment(id) },
    ]);
  };

  const startAddJob = () => {
    setJobDescription('');
    setJobAmount('');
    setAddingJob(true);
  };

  const handleSaveJob = async () => {
    if (!jobDescription.trim()) {
      Alert.alert('Error', 'Please describe the job');
      return;
    }
    const amountNum = parseFloat(jobAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await addWorkerFixedJob({
      workerId: worker.id,
      description: jobDescription.trim(),
      amount: amountNum,
      date: new Date().toISOString(),
    });
    setAddingJob(false);
  };

  const handleDeleteJob = (id: string) => {
    Alert.alert('Delete Job', 'Remove this fixed-price job record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWorkerFixedJob(id) },
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
              setAddingJob(false);
              onClose();
            }}
            style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Worker</Text>
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
            <Text style={styles.label}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleRow}>
              {ROLE_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}>
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Daily Wage (₹)</Text>
            <TextInput
              style={styles.input}
              value={dailyWage}
              onChangeText={setDailyWage}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(['active', 'inactive'] as WorkerStatus[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, status === s && styles.statusChipActive]}
                  onPress={() => setStatus(s)}>
                  <Text
                    style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
                    {s === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteWorker}>
              <Text style={styles.deleteBtnText}>Delete Worker</Text>
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
        ) : addingJob ? (
          <ScrollView contentContainerStyle={styles.editForm}>
            <Text style={styles.label}>Job Description</Text>
            <TextInput
              style={styles.input}
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="e.g. Electrical wiring — full house"
              placeholderTextColor={COLORS.muted}
              autoFocus
            />
            <Text style={styles.label}>Fixed Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={jobAmount}
              onChangeText={setJobAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              This adds to {worker.name}'s total earned, separate from daily attendance.
            </Text>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveJob}>
              <Text style={styles.saveBtnText}>Save Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddingJob(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Text style={styles.heroName}>{worker.name}</Text>
              <Text style={styles.heroRole}>
                {worker.role} · ₹{worker.dailyWage.toLocaleString('en-IN')}/day
                {worker.status === 'inactive' ? ' · Inactive' : ''}
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Earned</Text>
                  <Text style={styles.summaryValue}>₹{earned.toLocaleString('en-IN')}</Text>
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
                <TouchableOpacity style={styles.jobBtn} onPress={startAddJob} activeOpacity={0.85}>
                  <Text style={styles.jobBtnText}>+ Fixed-Price Job</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Attendance History</Text>
            {attendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance recorded yet.</Text>
            ) : (
              attendance.map(a => (
                <View key={a.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPrimary}>{formatDate(a.date)}</Text>
                    <Text style={styles.historySub}>
                      {ATTENDANCE_LABEL[a.status]}
                      {stageName(a.stageId) ? ` · ${stageName(a.stageId)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>₹{a.amount.toLocaleString('en-IN')}</Text>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Fixed-Price Jobs</Text>
            {fixedJobs.length === 0 ? (
              <Text style={styles.emptyText}>No fixed-price jobs recorded yet.</Text>
            ) : (
              fixedJobs.map(j => (
                <View key={j.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPrimary} numberOfLines={1}>
                      {j.description}
                    </Text>
                    <Text style={styles.historySub}>{formatDate(j.date)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>₹{j.amount.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity onPress={() => handleDeleteJob(j.id)}>
                      <Text style={styles.deleteLink}>Remove</Text>
                    </TouchableOpacity>
                  </View>
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
  jobBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  jobBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
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
  roleRow: { flexDirection: 'row' },
  roleChip: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  roleChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  roleChipText: { color: COLORS.muted, fontSize: 13 },
  roleChipTextActive: { color: COLORS.accent },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
  },
  statusChipActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  statusChipText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  statusChipTextActive: { color: COLORS.accent },
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
