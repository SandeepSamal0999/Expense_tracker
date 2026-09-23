import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import {
  Transaction,
  Budget,
  User,
  CategoryMeta,
  House,
  ConstructionStage,
  Worker,
  WorkerAttendance,
  WorkerPayment,
  WorkerFixedJob,
  Material,
  Vendor,
  VendorPayment,
} from '../types';
import { AppSettings } from '../services/storageService';
import * as api from '../services/api';
import * as categoryService from '../services/categoryService';
import * as storage from '../services/storageService';
import * as houseService from '../services/houseService';
import * as workerService from '../services/workerService';
import * as materialService from '../services/materialService';
import * as vendorService from '../services/vendorService';
import { syncWidget } from '../services/widgetService';

interface AppState {
  user: User | null;
  expenses: Transaction[];
  budgets: Budget[];
  categories: CategoryMeta[];
  settings: AppSettings;
  house: House | null;
  stages: ConstructionStage[];
  workers: Worker[];
  workerAttendance: WorkerAttendance[];
  workerPayments: WorkerPayment[];
  workerFixedJobs: WorkerFixedJob[];
  materials: Material[];
  vendors: Vendor[];
  vendorPayments: VendorPayment[];
  isLoading: boolean;
  isAuthChecked: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_CHECKED' }
  | { type: 'SET_EXPENSES'; payload: Transaction[] }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_CATEGORIES'; payload: CategoryMeta[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_HOUSE'; payload: House | null }
  | { type: 'SET_STAGES'; payload: ConstructionStage[] }
  | { type: 'SET_WORKERS'; payload: Worker[] }
  | { type: 'SET_WORKER_ATTENDANCE'; payload: WorkerAttendance[] }
  | { type: 'SET_WORKER_PAYMENTS'; payload: WorkerPayment[] }
  | { type: 'SET_WORKER_FIXED_JOBS'; payload: WorkerFixedJob[] }
  | { type: 'SET_MATERIALS'; payload: Material[] }
  | { type: 'SET_VENDORS'; payload: Vendor[] }
  | { type: 'SET_VENDOR_PAYMENTS'; payload: VendorPayment[] }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  expenses: [],
  budgets: [],
  categories: categoryService.DEFAULT_CATEGORIES,
  settings: { smsEnabled: false, notifEnabled: false },
  house: null,
  stages: [],
  workers: [],
  workerAttendance: [],
  workerPayments: [],
  workerFixedJobs: [],
  materials: [],
  vendors: [],
  vendorPayments: [],
  isLoading: true,
  isAuthChecked: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':      return { ...state, isLoading: action.payload };
    case 'SET_USER':         return { ...state, user: action.payload };
    case 'SET_AUTH_CHECKED': return { ...state, isAuthChecked: true, isLoading: false };
    case 'SET_EXPENSES':     return { ...state, expenses: action.payload };
    case 'SET_BUDGETS':      return { ...state, budgets: action.payload };
    case 'SET_CATEGORIES':   return { ...state, categories: action.payload };
    case 'SET_SETTINGS':     return { ...state, settings: action.payload };
    case 'SET_HOUSE':        return { ...state, house: action.payload };
    case 'SET_STAGES':       return { ...state, stages: action.payload };
    case 'SET_WORKERS':      return { ...state, workers: action.payload };
    case 'SET_WORKER_ATTENDANCE': return { ...state, workerAttendance: action.payload };
    case 'SET_WORKER_PAYMENTS':   return { ...state, workerPayments: action.payload };
    case 'SET_WORKER_FIXED_JOBS': return { ...state, workerFixedJobs: action.payload };
    case 'SET_MATERIALS':         return { ...state, materials: action.payload };
    case 'SET_VENDORS':           return { ...state, vendors: action.payload };
    case 'SET_VENDOR_PAYMENTS':   return { ...state, vendorPayments: action.payload };
    case 'LOGOUT':           return { ...initialState, isAuthChecked: true, isLoading: false };
    default:                 return state;
  }
}

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  addExpense: (expense: Transaction) => Promise<void>;
  editExpense: (expense: Transaction) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  addCategory: (name: string, emoji: string) => Promise<void>;
  updateCategory: (originalName: string, name: string, emoji: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  setupHouse: (house: House) => Promise<void>;
  updateHouse: (house: House) => Promise<void>;
  addStage: (name: string) => Promise<void>;
  updateStage: (id: string, patch: Partial<ConstructionStage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  reorderStages: (stages: ConstructionStage[]) => Promise<void>;
  addWorker: (worker: Omit<Worker, 'id'>) => Promise<void>;
  updateWorker: (id: string, patch: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  recordAttendanceBatch: (entries: WorkerAttendance[]) => Promise<void>;
  addWorkerPayment: (payment: Omit<WorkerPayment, 'id'>) => Promise<void>;
  deleteWorkerPayment: (id: string) => Promise<void>;
  addWorkerFixedJob: (job: Omit<WorkerFixedJob, 'id'>) => Promise<void>;
  deleteWorkerFixedJob: (id: string) => Promise<void>;
  addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (id: string, patch: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (id: string, patch: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addVendorPayment: (payment: Omit<VendorPayment, 'id'>) => Promise<void>;
  deleteVendorPayment: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const [
          user,
          categories,
          settings,
          house,
          stages,
          workers,
          workerAttendance,
          workerPayments,
          workerFixedJobs,
          materials,
          vendors,
          vendorPayments,
        ] = await Promise.all([
          api.getCurrentUser(),
          categoryService.getCategories(),
          storage.getSettings(),
          houseService.getHouse(),
          houseService.getStages(),
          workerService.getWorkers(),
          workerService.getAttendance(),
          workerService.getPayments(),
          workerService.getFixedJobs(),
          materialService.getMaterials(),
          vendorService.getVendors(),
          vendorService.getPayments(),
        ]);
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
        dispatch({ type: 'SET_HOUSE', payload: house });
        dispatch({ type: 'SET_STAGES', payload: stages });
        dispatch({ type: 'SET_WORKERS', payload: workers });
        dispatch({ type: 'SET_WORKER_ATTENDANCE', payload: workerAttendance });
        dispatch({ type: 'SET_WORKER_PAYMENTS', payload: workerPayments });
        dispatch({ type: 'SET_WORKER_FIXED_JOBS', payload: workerFixedJobs });
        dispatch({ type: 'SET_MATERIALS', payload: materials });
        dispatch({ type: 'SET_VENDORS', payload: vendors });
        dispatch({ type: 'SET_VENDOR_PAYMENTS', payload: vendorPayments });
        dispatch({ type: 'SET_USER', payload: user });
        if (user) {
          const [expenses, budgets] = await Promise.all([
            api.fetchExpenses(),
            api.fetchBudgets(),
          ]);
          dispatch({ type: 'SET_EXPENSES', payload: expenses });
          dispatch({ type: 'SET_BUDGETS', payload: budgets });
          syncWidget(expenses);
        }
      } finally {
        dispatch({ type: 'SET_AUTH_CHECKED' });
      }
    })();
  }, []);

  const refreshData = useCallback(async () => {
    const [expenses, budgets] = await Promise.all([
      api.fetchExpenses(),
      api.fetchBudgets(),
    ]);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
    dispatch({ type: 'SET_BUDGETS', payload: budgets });
    syncWidget(expenses);
  }, []);

  // Re-sync data (and the home-screen widget) whenever the app is brought
  // back to the foreground — not just on cold start or manual pull-to-refresh —
  // so the widget reflects transactions captured while the app was backgrounded.
  const appState = useRef(RNAppState.currentState);
  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshData();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [refreshData]);

  const contextValue: AppContextType = {
    state,
    login: async (email, password) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await api.login(email, password);
      dispatch({ type: 'SET_USER', payload: user });
      await refreshData();
      dispatch({ type: 'SET_LOADING', payload: false });
    },
    signup: async (name, email, phone, password) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await api.signup(name, email, phone, password);
      dispatch({ type: 'SET_USER', payload: user });
      await refreshData();
      dispatch({ type: 'SET_LOADING', payload: false });
    },
    logout: async () => {
      await api.logout();
      dispatch({ type: 'LOGOUT' });
    },
    updateUser: async (user) => {
      await storage.saveUser(user);
      dispatch({ type: 'SET_USER', payload: user });
    },
    addExpense: async (expense) => {
      const expenses = await api.createExpense(expense);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      syncWidget(expenses);
    },
    editExpense: async (expense) => {
      const expenses = await api.editExpense(expense);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      syncWidget(expenses);
    },
    deleteExpense: async (id) => {
      const expenses = await api.removeExpense(id);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      syncWidget(expenses);
    },
    addBudget: async (budget) => {
      const budgets = await api.upsertBudget(budget);
      dispatch({ type: 'SET_BUDGETS', payload: budgets });
    },
    deleteBudget: async (id) => {
      const budgets = await api.removeBudget(id);
      dispatch({ type: 'SET_BUDGETS', payload: budgets });
    },
    refreshData,
    addCategory: async (name, emoji) => {
      const categories = await categoryService.addCategory(name, emoji);
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    },
    updateCategory: async (originalName, name, emoji) => {
      const categories = await categoryService.updateCategory(originalName, name, emoji);
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    },
    deleteCategory: async (name) => {
      const categories = await categoryService.deleteCategory(name);
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    },
    updateSettings: async (settings) => {
      await storage.saveSettings(settings);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    },
    setupHouse: async (house) => {
      await houseService.saveHouse(house);
      dispatch({ type: 'SET_HOUSE', payload: house });
      if (state.stages.length === 0) {
        const stages = houseService.createDefaultStages();
        await houseService.saveStages(stages);
        dispatch({ type: 'SET_STAGES', payload: stages });
      }
    },
    updateHouse: async (house) => {
      await houseService.saveHouse(house);
      dispatch({ type: 'SET_HOUSE', payload: house });
    },
    addStage: async (name) => {
      const stages = await houseService.addStage(name);
      dispatch({ type: 'SET_STAGES', payload: stages });
    },
    updateStage: async (id, patch) => {
      const stages = await houseService.updateStage(id, patch);
      dispatch({ type: 'SET_STAGES', payload: stages });
    },
    deleteStage: async (id) => {
      const stages = await houseService.deleteStage(id);
      dispatch({ type: 'SET_STAGES', payload: stages });
    },
    reorderStages: async (stages) => {
      await houseService.saveStages(stages);
      dispatch({ type: 'SET_STAGES', payload: stages });
    },
    addWorker: async (worker) => {
      const workers = await workerService.addWorker(worker);
      dispatch({ type: 'SET_WORKERS', payload: workers });
    },
    updateWorker: async (id, patch) => {
      const workers = await workerService.updateWorker(id, patch);
      dispatch({ type: 'SET_WORKERS', payload: workers });
    },
    deleteWorker: async (id) => {
      const workers = await workerService.deleteWorker(id);
      const attendance = (await workerService.getAttendance()).filter(a => a.workerId !== id);
      await workerService.saveAttendance(attendance);
      const payments = (await workerService.getPayments()).filter(p => p.workerId !== id);
      await workerService.savePayments(payments);
      const fixedJobs = (await workerService.getFixedJobs()).filter(j => j.workerId !== id);
      await workerService.saveFixedJobs(fixedJobs);
      dispatch({ type: 'SET_WORKERS', payload: workers });
      dispatch({ type: 'SET_WORKER_ATTENDANCE', payload: attendance });
      dispatch({ type: 'SET_WORKER_PAYMENTS', payload: payments });
      dispatch({ type: 'SET_WORKER_FIXED_JOBS', payload: fixedJobs });
    },
    recordAttendanceBatch: async (entries) => {
      const records = await workerService.recordAttendanceBatch(entries);
      dispatch({ type: 'SET_WORKER_ATTENDANCE', payload: records });
    },
    addWorkerPayment: async (payment) => {
      const payments = await workerService.addPayment(payment);
      dispatch({ type: 'SET_WORKER_PAYMENTS', payload: payments });
    },
    deleteWorkerPayment: async (id) => {
      const payments = await workerService.deletePayment(id);
      dispatch({ type: 'SET_WORKER_PAYMENTS', payload: payments });
    },
    addWorkerFixedJob: async (job) => {
      const jobs = await workerService.addFixedJob(job);
      dispatch({ type: 'SET_WORKER_FIXED_JOBS', payload: jobs });
    },
    deleteWorkerFixedJob: async (id) => {
      const jobs = await workerService.deleteFixedJob(id);
      dispatch({ type: 'SET_WORKER_FIXED_JOBS', payload: jobs });
    },
    addMaterial: async (material) => {
      const materials = await materialService.addMaterial(material);
      dispatch({ type: 'SET_MATERIALS', payload: materials });
    },
    updateMaterial: async (id, patch) => {
      const materials = await materialService.updateMaterial(id, patch);
      dispatch({ type: 'SET_MATERIALS', payload: materials });
    },
    deleteMaterial: async (id) => {
      const materials = await materialService.deleteMaterial(id);
      dispatch({ type: 'SET_MATERIALS', payload: materials });
    },
    addVendor: async (vendor) => {
      const vendors = await vendorService.addVendor(vendor);
      dispatch({ type: 'SET_VENDORS', payload: vendors });
    },
    updateVendor: async (id, patch) => {
      const vendors = await vendorService.updateVendor(id, patch);
      dispatch({ type: 'SET_VENDORS', payload: vendors });
    },
    deleteVendor: async (id) => {
      const vendors = await vendorService.deleteVendor(id);
      const payments = (await vendorService.getPayments()).filter(p => p.vendorId !== id);
      await vendorService.savePayments(payments);
      dispatch({ type: 'SET_VENDORS', payload: vendors });
      dispatch({ type: 'SET_VENDOR_PAYMENTS', payload: payments });
    },
    addVendorPayment: async (payment) => {
      const payments = await vendorService.addPayment(payment);
      dispatch({ type: 'SET_VENDOR_PAYMENTS', payload: payments });
    },
    deleteVendorPayment: async (id) => {
      const payments = await vendorService.deletePayment(id);
      dispatch({ type: 'SET_VENDOR_PAYMENTS', payload: payments });
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
