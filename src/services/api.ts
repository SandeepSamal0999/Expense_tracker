import { Transaction, Budget, User } from '../types';
import * as storage from './storageService';

// ─── Backend API (uncomment when backend is ready) ───────────────────────────
//
// const BASE_URL = 'http://10.0.2.2:3001/api';
//
// async function authHeaders(): Promise<HeadersInit> {
//   const token = await storage.getToken();
//   return {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// }
//
// async function request<T>(path: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(`${BASE_URL}${path}`, options);
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
//   return json as T;
// }
//
// function toTransaction(raw: any): Transaction {
//   const { userId: _u, user_id: _uid, ...rest } = raw;
//   return rest as Transaction;
// }
//
// function toBudget(raw: any): Budget {
//   const { userId: _u, user_id: _uid, ...rest } = raw;
//   return rest as Budget;
// }
//
// export async function login(email: string, password: string): Promise<User> {
//   const { token, user } = await request<{ token: string; user: User }>('/auth/login', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ email, password }),
//   });
//   await storage.saveToken(token);
//   await storage.saveUser(user);
//   return user;
// }
//
// export async function signup(name: string, email: string, phone: string, password: string): Promise<User> {
//   const { token, user } = await request<{ token: string; user: User }>('/auth/signup', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ name, email, phone, password }),
//   });
//   await storage.saveToken(token);
//   await storage.saveUser(user);
//   return user;
// }
//
// export async function logout(): Promise<void> { await storage.clearUser(); }
//
// export async function getCurrentUser(): Promise<User | null> { return storage.getUser(); }
//
// export async function fetchExpenses(): Promise<Transaction[]> {
//   const headers = await authHeaders();
//   const { transactions } = await request<{ transactions: Transaction[] }>('/transactions', { headers });
//   return transactions.map(toTransaction);
// }
//
// export async function createExpense(expense: Transaction): Promise<Transaction[]> {
//   const headers = await authHeaders();
//   await request<{ transaction: Transaction }>('/transactions', {
//     method: 'POST', headers, body: JSON.stringify(expense),
//   });
//   return fetchExpenses();
// }
//
// export async function editExpense(expense: Transaction): Promise<Transaction[]> {
//   const headers = await authHeaders();
//   await request<{ transaction: Transaction }>(`/transactions/${expense.id}`, {
//     method: 'PATCH', headers, body: JSON.stringify(expense),
//   });
//   return fetchExpenses();
// }
//
// export async function removeExpense(id: string): Promise<Transaction[]> {
//   const headers = await authHeaders();
//   await request<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE', headers });
//   return fetchExpenses();
// }
//
// export async function fetchBudgets(): Promise<Budget[]> {
//   const headers = await authHeaders();
//   const { budgets } = await request<{ budgets: Budget[] }>('/budgets', { headers });
//   return budgets.map(toBudget);
// }
//
// export async function upsertBudget(budget: Budget): Promise<Budget[]> {
//   const headers = await authHeaders();
//   await request<{ budget: Budget }>('/budgets', {
//     method: 'POST', headers,
//     body: JSON.stringify({ category: budget.category, limit: budget.limit, month: budget.month }),
//   });
//   return fetchBudgets();
// }
//
// export async function removeBudget(id: string): Promise<Budget[]> {
//   const headers = await authHeaders();
//   await request<{ success: boolean }>(`/budgets/${id}`, { method: 'DELETE', headers });
//   return fetchBudgets();
// }
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── AsyncStorage (active) ───────────────────────────────────────────────────

export async function login(email: string, _password: string): Promise<User> {
  const existing = await storage.getUser();
  if (existing && existing.email === email) {
    return existing;
  }
  // No user saved yet — first time login, create the user
  if (!existing) {
    const user: User = { id: Date.now().toString(), name: email.split('@')[0], email, phone: '' };
    await storage.saveUser(user);
    return user;
  }
  throw new Error('Invalid email or password');
}

export async function signup(
  name: string,
  email: string,
  phone: string,
  _password: string,
): Promise<User> {
  const user: User = { id: Date.now().toString(), name, email, phone };
  await storage.saveUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await storage.clearUser();
}

export async function getCurrentUser(): Promise<User | null> {
  return storage.getUser();
}

export async function fetchExpenses(): Promise<Transaction[]> {
  return storage.getExpenses();
}

export async function createExpense(expense: Transaction): Promise<Transaction[]> {
  return storage.addExpense(expense);
}

export async function editExpense(expense: Transaction): Promise<Transaction[]> {
  return storage.updateExpense(expense);
}

export async function removeExpense(id: string): Promise<Transaction[]> {
  return storage.deleteExpense(id);
}

export async function fetchBudgets(): Promise<Budget[]> {
  return storage.getBudgets();
}

export async function upsertBudget(budget: Budget): Promise<Budget[]> {
  return storage.setBudget(budget);
}

export async function removeBudget(id: string): Promise<Budget[]> {
  return storage.deleteBudget(id);
}
