import { Transaction, Budget, User } from '../types';
import * as storage from './storageService';

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Auth
export async function login(email: string, _password: string): Promise<User> {
  await delay();
  const user: User = {
    id: '1',
    name: email.split('@')[0],
    email,
    phone: '',
  };
  await storage.saveUser(user);
  return user;
}

export async function signup(
  name: string,
  email: string,
  phone: string,
  _password: string,
): Promise<User> {
  await delay();
  const user: User = {
    id: Date.now().toString(),
    name,
    email,
    phone,
  };
  await storage.saveUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await delay(100);
  await storage.clearUser();
}

export async function getCurrentUser(): Promise<User | null> {
  return storage.getUser();
}

// Expenses
export async function fetchExpenses(): Promise<Transaction[]> {
  await delay(100);
  return storage.getExpenses();
}

export async function createExpense(expense: Transaction): Promise<Transaction[]> {
  await delay();
  return storage.addExpense(expense);
}

export async function editExpense(expense: Transaction): Promise<Transaction[]> {
  await delay();
  return storage.updateExpense(expense);
}

export async function removeExpense(id: string): Promise<Transaction[]> {
  await delay();
  return storage.deleteExpense(id);
}

// Budgets
export async function fetchBudgets(): Promise<Budget[]> {
  await delay(100);
  return storage.getBudgets();
}

export async function upsertBudget(budget: Budget): Promise<Budget[]> {
  await delay();
  return storage.setBudget(budget);
}

export async function removeBudget(id: string): Promise<Budget[]> {
  await delay();
  return storage.deleteBudget(id);
}
