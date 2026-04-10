import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Transaction, Budget, User, CategoryMeta } from '../types';
import { AppSettings } from '../services/storageService';
import * as api from '../services/api';
import * as categoryService from '../services/categoryService';
import * as storage from '../services/storageService';

interface AppState {
  user: User | null;
  expenses: Transaction[];
  budgets: Budget[];
  categories: CategoryMeta[];
  settings: AppSettings;
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
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  expenses: [],
  budgets: [],
  categories: categoryService.DEFAULT_CATEGORIES,
  settings: { smsEnabled: false, notifEnabled: false },
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
    case 'LOGOUT':           return { ...initialState, isAuthChecked: true, isLoading: false };
    default:                 return state;
  }
}

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const [user, categories, settings] = await Promise.all([
          api.getCurrentUser(),
          categoryService.getCategories(),
          storage.getSettings(),
        ]);
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
        dispatch({ type: 'SET_USER', payload: user });
        if (user) {
          const [expenses, budgets] = await Promise.all([
            api.fetchExpenses(),
            api.fetchBudgets(),
          ]);
          dispatch({ type: 'SET_EXPENSES', payload: expenses });
          dispatch({ type: 'SET_BUDGETS', payload: budgets });
        }
      } finally {
        dispatch({ type: 'SET_AUTH_CHECKED' });
      }
    })();
  }, []);

  const refreshData = async () => {
    const [expenses, budgets] = await Promise.all([
      api.fetchExpenses(),
      api.fetchBudgets(),
    ]);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
    dispatch({ type: 'SET_BUDGETS', payload: budgets });
  };

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
    addExpense: async (expense) => {
      const expenses = await api.createExpense(expense);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    },
    editExpense: async (expense) => {
      const expenses = await api.editExpense(expense);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    },
    deleteExpense: async (id) => {
      const expenses = await api.removeExpense(id);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
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
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
