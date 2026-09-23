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
  type?: 'debit' | 'credit'; // undefined treated as 'debit' for backward compat
  stageId?: string; // links this expense to a house-construction stage
  materialId?: string; // links this expense to a material (merchant doubles as vendor)
  quantity?: number;
  unitRate?: number;
  vendorId?: string; // links this purchase to a registered Vendor
}

export type HouseStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

export interface House {
  name: string;
  location: string;
  startDate: string; // ISO date
  expectedCompletionDate: string; // ISO date
  status: HouseStatus;
  budget: number;
  tagline?: string; // e.g. "Building today, a better tomorrow"
}

export interface ConstructionStage {
  id: string;
  name: string;
  order: number;
  status: StageStatus;
  budget: number; // 0 = not set
  description?: string; // e.g. "Excavation, footings and foundation work"
}

export interface Material {
  id: string;
  name: string;
  unit: string; // e.g. bag, kg, ton, piece, sq.ft, litre, load, meter, other
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  address: string;
  gstNumber: string;
  notes: string;
}

// Actual money paid to a vendor — kept separate from purchases (Transaction.vendorId)
// so "purchased" and "paid" can differ, same principle as WorkerPayment.
export interface VendorPayment {
  id: string;
  vendorId: string;
  date: string; // ISO string
  amount: number;
  notes: string;
}

export type WorkerStatus = 'active' | 'inactive';
export type AttendanceStatus = 'full_day' | 'half_day' | 'absent' | 'holiday';

export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  dailyWage: number;
  status: WorkerStatus;
  joiningDate: string; // ISO date
  notes: string;
}

export interface WorkerAttendance {
  id: string; // `${workerId}_${date}` — one record per worker per day, upserted
  workerId: string;
  date: string; // 'YYYY-MM-DD', IST
  status: AttendanceStatus;
  stageId?: string;
  amount: number; // dailyWage × multiplier, computed at record time
}

export interface WorkerPayment {
  id: string;
  workerId: string;
  date: string; // ISO string
  amount: number;
  notes: string;
}

// A one-off fixed-price job (e.g. "Electrical work — ₹85,000 fixed"), separate
// from day-by-day attendance earnings but adding to the same worker's total earned.
export interface WorkerFixedJob {
  id: string;
  workerId: string;
  description: string;
  amount: number;
  date: string; // ISO string
  stageId?: string;
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
