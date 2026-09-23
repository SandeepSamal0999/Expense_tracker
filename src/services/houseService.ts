import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConstructionStage, House } from '../types';

const HOUSE_KEY = '@expense_tracker_house';
const STAGES_KEY = '@expense_tracker_stages';

export const DEFAULT_STAGES: { name: string; description: string }[] = [
  { name: 'Planning', description: 'Design, approvals and initial work' },
  { name: 'Foundation', description: 'Excavation, footings and foundation work' },
  { name: 'Structure', description: 'Columns, beams and structural framework' },
  { name: 'Brickwork', description: 'Walls and brick masonry work' },
  { name: 'Plastering', description: 'Wall and ceiling plaster finishing' },
  { name: 'Electrical', description: 'Wiring, switches and electrical fittings' },
  { name: 'Plumbing', description: 'Pipes, fittings and water connections' },
  { name: 'Flooring', description: 'Tiles, marble and floor finishing' },
  { name: 'Painting', description: 'Interior and exterior painting' },
  { name: 'Final Work', description: 'Finishing touches and clean-up' },
];

export async function getHouse(): Promise<House | null> {
  const data = await AsyncStorage.getItem(HOUSE_KEY);
  return data ? JSON.parse(data) : null;
}

export async function saveHouse(house: House): Promise<void> {
  await AsyncStorage.setItem(HOUSE_KEY, JSON.stringify(house));
}

export async function getStages(): Promise<ConstructionStage[]> {
  const data = await AsyncStorage.getItem(STAGES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveStages(stages: ConstructionStage[]): Promise<void> {
  await AsyncStorage.setItem(STAGES_KEY, JSON.stringify(stages));
}

export function createDefaultStages(): ConstructionStage[] {
  return DEFAULT_STAGES.map(({ name, description }, i) => ({
    id: `${Date.now()}-${i}`,
    name,
    order: i,
    status: 'not_started',
    budget: 0,
    description,
  }));
}

export async function addStage(name: string): Promise<ConstructionStage[]> {
  const stages = await getStages();
  const newStage: ConstructionStage = {
    id: Date.now().toString(),
    name: name.trim(),
    order: stages.length,
    status: 'not_started',
    budget: 0,
  };
  const updated = [...stages, newStage];
  await saveStages(updated);
  return updated;
}

export async function updateStage(
  id: string,
  patch: Partial<ConstructionStage>,
): Promise<ConstructionStage[]> {
  const stages = await getStages();
  const updated = stages.map(s => (s.id === id ? { ...s, ...patch } : s));
  await saveStages(updated);
  return updated;
}

export async function deleteStage(id: string): Promise<ConstructionStage[]> {
  const stages = await getStages();
  const updated = stages.filter(s => s.id !== id);
  await saveStages(updated);
  return updated;
}
