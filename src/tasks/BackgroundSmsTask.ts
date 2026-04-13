/**
 * BackgroundSmsTask — Headless JS task (Android only)
 *
 * This task is started by SmsHeadlessTaskService when an SMS arrives and the
 * React Native app is NOT currently in the foreground. It parses the pending
 * raw SMS messages stored by SmsReceiver and writes fully-parsed Transactions
 * directly to AsyncStorage — no app open required.
 *
 * Registered in index.js as 'SmsProcessorTask'.
 */

import { NativeModules } from 'react-native';
import { parseSmsToTransaction } from '../services/transactionParser';
import { addExpense } from '../services/storageService';
import { Transaction } from '../types';

const { SmsModule } = NativeModules;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default async (_taskData: unknown): Promise<void> => {
  if (!SmsModule) return;

  try {
    const raw: string = await SmsModule.getPendingSms();
    const list: { address: string; body: string; date: number }[] = JSON.parse(raw);
    if (list.length === 0) return;

    // Clear the queue before processing so a concurrent drain (on app open) cannot
    // pick up the same messages if the app starts while this task is still running.
    SmsModule.clearPendingSms();

    for (const sms of list) {
      const parsed = parseSmsToTransaction(sms);
      if (parsed) {
        const tx: Transaction = { id: generateId(), ...parsed };
        await addExpense(tx);
      }
    }
  } catch (_) {
    // Silently ignore — a failed background parse is not fatal.
    // The raw SMS is already cleared from the queue; nothing is lost because
    // the original SMS is still in the device's SMS inbox and can be recovered
    // if the user re-scans from Settings.
  }
};
