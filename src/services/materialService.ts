import AsyncStorage from '@react-native-async-storage/async-storage';
import { Material } from '../types';

const MATERIALS_KEY = '@expense_tracker_materials';

export const UNIT_OPTIONS = [
  'bag',
  'kg',
  'ton',
  'piece',
  'sq.ft',
  'litre',
  'load',
  'meter',
  'other',
];

export async function getMaterials(): Promise<Material[]> {
  const data = await AsyncStorage.getItem(MATERIALS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveMaterials(materials: Material[]): Promise<void> {
  await AsyncStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

export async function addMaterial(material: Omit<Material, 'id'>): Promise<Material[]> {
  const materials = await getMaterials();
  const updated = [...materials, { ...material, id: Date.now().toString() }];
  await saveMaterials(updated);
  return updated;
}

export async function updateMaterial(
  id: string,
  patch: Partial<Material>,
): Promise<Material[]> {
  const materials = await getMaterials();
  const updated = materials.map(m => (m.id === id ? { ...m, ...patch } : m));
  await saveMaterials(updated);
  return updated;
}

export async function deleteMaterial(id: string): Promise<Material[]> {
  const materials = await getMaterials();
  const updated = materials.filter(m => m.id !== id);
  await saveMaterials(updated);
  return updated;
}
