import AsyncStorage from '@react-native-async-storage/async-storage';
import { Worker, WorkerAttendance, WorkerPayment, WorkerFixedJob } from '../types';

const WORKERS_KEY = '@expense_tracker_workers';
const ATTENDANCE_KEY = '@expense_tracker_worker_attendance';
const PAYMENTS_KEY = '@expense_tracker_worker_payments';
const FIXED_JOBS_KEY = '@expense_tracker_worker_fixed_jobs';

export const ROLE_OPTIONS = [
  'Mason',
  'Helper',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Tile Worker',
  'Other',
];

// ─── Workers ──────────────────────────────────────────────────────────────────

export async function getWorkers(): Promise<Worker[]> {
  const data = await AsyncStorage.getItem(WORKERS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveWorkers(workers: Worker[]): Promise<void> {
  await AsyncStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
}

export async function addWorker(worker: Omit<Worker, 'id'>): Promise<Worker[]> {
  const workers = await getWorkers();
  const updated = [...workers, { ...worker, id: Date.now().toString() }];
  await saveWorkers(updated);
  return updated;
}

export async function updateWorker(id: string, patch: Partial<Worker>): Promise<Worker[]> {
  const workers = await getWorkers();
  const updated = workers.map(w => (w.id === id ? { ...w, ...patch } : w));
  await saveWorkers(updated);
  return updated;
}

export async function deleteWorker(id: string): Promise<Worker[]> {
  const workers = await getWorkers();
  const updated = workers.filter(w => w.id !== id);
  await saveWorkers(updated);
  return updated;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getAttendance(): Promise<WorkerAttendance[]> {
  const data = await AsyncStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveAttendance(records: WorkerAttendance[]): Promise<void> {
  await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

// Upserts a batch of attendance records (one per worker for a given day),
// keyed by `${workerId}_${date}` so re-recording a day corrects it in place.
export async function recordAttendanceBatch(
  entries: WorkerAttendance[],
): Promise<WorkerAttendance[]> {
  const existing = await getAttendance();
  const map = new Map(existing.map(r => [r.id, r]));
  entries.forEach(e => map.set(e.id, e));
  const updated = Array.from(map.values());
  await saveAttendance(updated);
  return updated;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<WorkerPayment[]> {
  const data = await AsyncStorage.getItem(PAYMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePayments(payments: WorkerPayment[]): Promise<void> {
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export async function addPayment(payment: Omit<WorkerPayment, 'id'>): Promise<WorkerPayment[]> {
  const payments = await getPayments();
  const updated = [...payments, { ...payment, id: Date.now().toString() }];
  await savePayments(updated);
  return updated;
}

export async function deletePayment(id: string): Promise<WorkerPayment[]> {
  const payments = await getPayments();
  const updated = payments.filter(p => p.id !== id);
  await savePayments(updated);
  return updated;
}

// ─── Fixed-price jobs ─────────────────────────────────────────────────────────

export async function getFixedJobs(): Promise<WorkerFixedJob[]> {
  const data = await AsyncStorage.getItem(FIXED_JOBS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveFixedJobs(jobs: WorkerFixedJob[]): Promise<void> {
  await AsyncStorage.setItem(FIXED_JOBS_KEY, JSON.stringify(jobs));
}

export async function addFixedJob(job: Omit<WorkerFixedJob, 'id'>): Promise<WorkerFixedJob[]> {
  const jobs = await getFixedJobs();
  const updated = [...jobs, { ...job, id: Date.now().toString() }];
  await saveFixedJobs(updated);
  return updated;
}

export async function deleteFixedJob(id: string): Promise<WorkerFixedJob[]> {
  const jobs = await getFixedJobs();
  const updated = jobs.filter(j => j.id !== id);
  await saveFixedJobs(updated);
  return updated;
}
