import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, User } from '../types';

const KEYS = {
  USER: '@expense_tracker_user',
  EXPENSES: '@expense_tracker_expenses',
  BUDGETS: '@expense_tracker_budgets',
  TOKEN: '@expense_tracker_token',
  SETTINGS: '@expense_tracker_settings',
};

export interface AppSettings {
  smsEnabled: boolean;
  notifEnabled: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : { smsEnabled: false, notifEnabled: false };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Token
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.TOKEN);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.TOKEN, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.TOKEN);
}

// User
export async function getUser(): Promise<User | null> {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
  await AsyncStorage.removeItem(KEYS.TOKEN);
}

// Expenses
export async function getExpenses(): Promise<Transaction[]> {
  const data = await AsyncStorage.getItem(KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
}

export async function saveExpenses(expenses: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}

export async function addExpense(expense: Transaction): Promise<Transaction[]> {
  const expenses = await getExpenses();
  expenses.unshift(expense);
  await saveExpenses(expenses);
  return expenses;
}

export async function updateExpense(updated: Transaction): Promise<Transaction[]> {
  const expenses = await getExpenses();
  const index = expenses.findIndex(e => e.id === updated.id);
  if (index !== -1) {
    expenses[index] = updated;
  }
  await saveExpenses(expenses);
  return expenses;
}

export async function deleteExpense(id: string): Promise<Transaction[]> {
  const expenses = await getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  await saveExpenses(filtered);
  return filtered;
}

// Budgets
export async function getBudgets(): Promise<Budget[]> {
  const data = await AsyncStorage.getItem(KEYS.BUDGETS);
  return data ? JSON.parse(data) : [];
}

export async function saveBudgets(budgets: Budget[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
}

export async function setBudget(budget: Budget): Promise<Budget[]> {
  const budgets = await getBudgets();
  const index = budgets.findIndex(
    b => b.category === budget.category && b.month === budget.month,
  );
  if (index !== -1) {
    budgets[index] = budget;
  } else {
    budgets.push(budget);
  }
  await saveBudgets(budgets);
  return budgets;
}

export async function deleteBudget(id: string): Promise<Budget[]> {
  const budgets = await getBudgets();
  const filtered = budgets.filter(b => b.id !== id);
  await saveBudgets(filtered);
  return filtered;
}
