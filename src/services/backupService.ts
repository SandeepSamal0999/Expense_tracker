import { Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@expense_tracker_user',
  EXPENSES: '@expense_tracker_expenses',
  BUDGETS: '@expense_tracker_budgets',
  CATEGORIES: '@expense_tracker_categories',
};

export async function exportBackup(): Promise<void> {
  const [user, expenses, budgets, categories] = await Promise.all([
    AsyncStorage.getItem(KEYS.USER),
    AsyncStorage.getItem(KEYS.EXPENSES),
    AsyncStorage.getItem(KEYS.BUDGETS),
    AsyncStorage.getItem(KEYS.CATEGORIES),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: user ? JSON.parse(user) : null,
    expenses: expenses ? JSON.parse(expenses) : [],
    budgets: budgets ? JSON.parse(budgets) : [],
    categories: categories ? JSON.parse(categories) : [],
  };

  await Share.share({
    title: 'ExpenseTracker Backup',
    message: JSON.stringify(backup, null, 2),
  });
}

export async function importBackup(json: string): Promise<{ success: boolean; message: string }> {
  try {
    const backup = JSON.parse(json.trim());

    if (!backup.version || !Array.isArray(backup.expenses)) {
      return { success: false, message: 'Invalid backup format.' };
    }

    await Promise.all([
      backup.user      && AsyncStorage.setItem(KEYS.USER,       JSON.stringify(backup.user)),
      backup.expenses  && AsyncStorage.setItem(KEYS.EXPENSES,   JSON.stringify(backup.expenses)),
      backup.budgets   && AsyncStorage.setItem(KEYS.BUDGETS,    JSON.stringify(backup.budgets)),
      backup.categories && AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(backup.categories)),
    ].filter(Boolean) as Promise<void>[]);

    return {
      success: true,
      message: `Restored ${backup.expenses.length} transactions and ${backup.budgets.length} budgets.`,
    };
  } catch {
    return { success: false, message: 'Could not parse backup. Make sure you pasted the full backup text.' };
  }
}
