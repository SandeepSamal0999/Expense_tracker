export type Category = string;

export type PaymentMethod = 'UPI' | 'SMS' | 'Notification' | 'Manual';
export type ExpenseSource = 'SMS' | 'Notification' | 'Manual';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  date: string; // ISO string
  notes: string;
  source: ExpenseSource;
  method: PaymentMethod;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  month: string; // YYYY-MM
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CategoryMeta {
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Budget: undefined;
  Settings: undefined;
};

export type TransactionsStackParamList = {
  TransactionsList: undefined;
  AddExpense: { transaction?: Transaction } | undefined;
};
