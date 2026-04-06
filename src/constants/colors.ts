import { Category, CategoryMeta } from '../types';

export const COLORS = {
  bg: '#0A0B0F',
  card: '#13151C',
  cardBorder: '#1E2130',
  accent: '#00E5A0',
  accentDim: '#00E5A020',
  text: '#F0F2FF',
  muted: '#5A6080',
  danger: '#FF4D6A',
  dangerDim: '#FF4D6A20',
  warning: '#FFB020',
  warningDim: '#FFB02020',
  success: '#00E5A0',
  successDim: '#00E5A020',
  inputBg: '#1A1D2E',
  food: '#FF6B6B',
  transport: '#4ECDC4',
  shopping: '#FFE66D',
  entertainment: '#A78BFA',
  health: '#60A5FA',
  bills: '#F472B6',
  other: '#F97316',
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: { color: COLORS.food, emoji: '🍱', label: 'Food' },
  Transport: { color: COLORS.transport, emoji: '🚗', label: 'Transport' },
  Shopping: { color: COLORS.shopping, emoji: '🛍️', label: 'Shopping' },
  Entertainment: { color: COLORS.entertainment, emoji: '🎬', label: 'Entertainment' },
  Health: { color: COLORS.health, emoji: '💊', label: 'Health' },
  Bills: { color: COLORS.bills, emoji: '📄', label: 'Bills' },
  Other: { color: COLORS.other, emoji: '📦', label: 'Other' },
};

export const ALL_CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Bills',
  'Other',
];
