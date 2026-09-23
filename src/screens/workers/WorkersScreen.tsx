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
import { Worker } from '../../types';
import { ROLE_OPTIONS } from '../../services/workerService';
import RecordAttendanceScreen from './RecordAttendanceScreen';
import WorkerDetailModal from '../../components/WorkerDetailModal';

export default function WorkersScreen({ navigation }: any) {
  const { state, addWorker } = useApp();
  const { workers, workerAttendance, workerPayments, workerFixedJobs } = state;

  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(ROLE_OPTIONS[0]);
  const [newPhone, setNewPhone] = useState('');
  const [newWage, setNewWage] = useState('');

  const earnedByWorker = useMemo(() => {
    const map: Record<string, number> = {};
    workerAttendance.forEach(a => (map[a.workerId] = (map[a.workerId] || 0) + a.amount));
    workerFixedJobs.forEach(j => (map[j.workerId] = (map[j.workerId] || 0) + j.amount));
    return map;
  }, [workerAttendance, workerFixedJobs]);

  const paidByWorker = useMemo(() => {
    const map: Record<string, number> = {};
    workerPayments.forEach(p => (map[p.workerId] = (map[p.workerId] || 0) + p.amount));
    return map;
  }, [workerPayments]);

  const totalPending = useMemo(
    () =>
      workers.reduce((sum, w) => {
        const pending = (earnedByWorker[w.id] || 0) - (paidByWorker[w.id] || 0);
        return sum + Math.max(pending, 0);
      }, 0),
    [workers, earnedByWorker, paidByWorker],
  );

  const activeCount = workers.filter(w => w.status === 'active').length;
  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || null;

  if (showAttendance) {
    return <RecordAttendanceScreen onBack={() => setShowAttendance(false)} />;
  }

  const handleAddWorker = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    const wageNum = parseFloat(newWage);
    if (!wageNum || wageNum <= 0) {
      Alert.alert('Error', 'Please enter a valid daily wage');
      return;
    }
    await addWorker({
      name: newName.trim(),
      role: newRole,
      phone: newPhone.trim(),
      dailyWage: wageNum,
      status: 'active',
      joiningDate: new Date().toISOString(),
      notes: '',
    });
    setNewName('');
    setNewRole(ROLE_OPTIONS[0]);
    setNewPhone('');
    setNewWage('');
    setShowAddWorker(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('House')}>
            <Text style={styles.backBtn}>← House</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workers</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Active Workers</Text>
            <Text style={styles.summaryValue}>{activeCount}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Pending</Text>
            <Text style={[styles.summaryValue, { color: totalPending > 0 ? COLORS.danger : COLORS.success }]}>
              ₹{totalPending.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.attendanceBtn}
          onPress={() => setShowAttendance(true)}
          activeOpacity={0.85}>
          <Text style={styles.attendanceBtnText}>📋 Record Attendance</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Workers</Text>
          <TouchableOpacity onPress={() => setShowAddWorker(true)}>
            <Text style={styles.addLink}>+ Add Worker</Text>
          </TouchableOpacity>
        </View>

        {workers.length === 0 ? (
          <Text style={styles.emptyText}>No workers added yet. Tap "+ Add Worker" to start.</Text>
        ) : (
          workers.map(w => {
            const pending = (earnedByWorker[w.id] || 0) - (paidByWorker[w.id] || 0);
            return (
              <TouchableOpacity
                key={w.id}
                style={styles.workerCard}
                onPress={() => setSelectedWorkerId(w.id)}
                activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>
                    {w.name}
                    {w.status === 'inactive' ? ' (Inactive)' : ''}
                  </Text>
                  <Text style={styles.workerRole}>
                    {w.role} · ₹{w.dailyWage.toLocaleString('en-IN')}/day
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

      <WorkerDetailModal
        visible={!!selectedWorker}
        worker={selectedWorker}
        onClose={() => setSelectedWorkerId(null)}
      />

      <Modal
        visible={showAddWorker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddWorker(false)}>
        <View style={styles.overlay}>
          <View style={styles.addModal}>
            <Text style={styles.addModalTitle}>Add Worker</Text>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Name"
              placeholderTextColor={COLORS.muted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleRow}>
              {ROLE_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, newRole === r && styles.roleChipActive]}
                  onPress={() => setNewRole(r)}>
                  <Text style={[styles.roleChipText, newRole === r && styles.roleChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.addInput}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Phone (optional)"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.addInput}
              value={newWage}
              onChangeText={setNewWage}
              placeholder="Daily Wage (₹)"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
            />
            <View style={styles.addActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddWorker(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddWorker}>
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
    marginBottom: 16,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 4 },
  attendanceBtn: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  attendanceBtnText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  addLink: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  workerCard: {
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
  workerName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  workerRole: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
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
  roleRow: { flexDirection: 'row', marginBottom: 12 },
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
