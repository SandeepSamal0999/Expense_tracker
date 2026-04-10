import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryMeta } from '../types';

const KEY = '@expense_tracker_categories';

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { name: 'Food',          emoji: '🍱', color: '#FF6B6B', isDefault: true },
  { name: 'Transport',     emoji: '🚗', color: '#4ECDC4', isDefault: true },
  { name: 'Shopping',      emoji: '🛍️', color: '#FFE66D', isDefault: true },
  { name: 'Entertainment', emoji: '🎬', color: '#A78BFA', isDefault: true },
  { name: 'Health',        emoji: '💊', color: '#60A5FA', isDefault: true },
  { name: 'Bills',         emoji: '📄', color: '#F472B6', isDefault: true },
  { name: 'Other',         emoji: '📦', color: '#F97316', isDefault: true },
];

// Colors to auto-assign for new categories
const COLOR_PALETTE = [
  '#34D399', '#FB923C', '#E879F9', '#22D3EE',
  '#A3E635', '#FBBF24', '#F87171', '#818CF8',
  '#2DD4BF', '#FCA5A5', '#86EFAC', '#FCD34D',
];

export async function getCategories(): Promise<CategoryMeta[]> {
  const data = await AsyncStorage.getItem(KEY);
  if (!data) return DEFAULT_CATEGORIES;
  const saved: CategoryMeta[] = JSON.parse(data);
  // Merge: always keep defaults in order, append custom ones
  const customOnly = saved.filter(c => !c.isDefault);
  return [...DEFAULT_CATEGORIES, ...customOnly];
}

export async function saveCategories(categories: CategoryMeta[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(categories));
}

export async function addCategory(name: string, emoji: string): Promise<CategoryMeta[]> {
  const current = await getCategories();
  // Auto-assign a color from the palette
  const usedColors = current.map(c => c.color);
  const color = COLOR_PALETTE.find(c => !usedColors.includes(c)) || COLOR_PALETTE[current.length % COLOR_PALETTE.length];
  const newCat: CategoryMeta = { name: name.trim(), emoji, color, isDefault: false };
  const updated = [...current, newCat];
  await saveCategories(updated);
  return updated;
}

export async function updateCategory(
  originalName: string,
  name: string,
  emoji: string,
): Promise<CategoryMeta[]> {
  const current = await getCategories();
  const updated = current.map(c =>
    c.name === originalName ? { ...c, name: name.trim(), emoji } : c,
  );
  await saveCategories(updated);
  return updated;
}

export function getCategoryMeta(categories: CategoryMeta[], name: string): CategoryMeta {
  return (
    categories.find(c => c.name === name) ?? {
      name,
      emoji: '📦',
      color: '#F97316',
      isDefault: false,
    }
  );
}

export async function deleteCategory(name: string): Promise<CategoryMeta[]> {
  const current = await getCategories();
  const updated = current.filter(c => c.name !== name || c.isDefault);
  await saveCategories(updated);
  return updated;
}
