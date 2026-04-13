import React, { useCallback } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { ToastProvider, useToast } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useAutoCapture } from './src/hooks/useAutoCapture';
import { useBudgetAlert } from './src/hooks/useBudgetAlert';
import { Transaction } from './src/types';

// ─── Auto-capture runner ──────────────────────────────────────────────────────
// Keeps SMS / notification listeners alive across all tabs.
// Shows a toast whenever a transaction is auto-detected so the user knows
// something was captured — with an Undo button to remove it if wrong.

function AutoCaptureRunner() {
  const { state, addExpense, deleteExpense } = useApp();
  const { show } = useToast();
  const { smsEnabled, notifEnabled } = state.settings;

  const handleTransaction = useCallback(
    (tx: Transaction) => {
      addExpense(tx);
      show({
        text: `₹${tx.amount.toLocaleString('en-IN')} · ${tx.merchant}`,
        subtext: `Auto-captured · ${tx.category}`,
        onUndo: () => deleteExpense(tx.id),
      });
    },
    [addExpense, deleteExpense, show],
  );

  useAutoCapture(smsEnabled, notifEnabled, handleTransaction);
  return null;
}

// ─── Budget alert runner ──────────────────────────────────────────────────────
// Watches expenses + budgets. Whenever a new expense pushes a category over
// 80 % or 100 % of its budget for the first time this session, shows a toast.

function BudgetAlertRunner() {
  const { state } = useApp();
  const { show } = useToast();

  useBudgetAlert(state.expenses, state.budgets, (category, pct) => {
    show({
      text:
        pct >= 100
          ? `${category} budget exceeded!`
          : `${category} at ${pct}% of budget`,
      subtext:
        pct >= 100
          ? 'You have gone over your limit'
          : 'Getting close to your limit',
      type: pct >= 100 ? 'error' : 'warning',
    });
  });

  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B0F" />
      <AppProvider>
        <ToastProvider>
          <AutoCaptureRunner />
          <BudgetAlertRunner />
          <RootNavigator />
        </ToastProvider>
      </AppProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0F',
  },
});
