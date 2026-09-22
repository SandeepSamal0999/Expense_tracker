import { NativeModules, Platform } from 'react-native';
import { Transaction } from '../types';
import { istDateString, istDateStringDaysAgo, istMonthString, istMonthStringMonthsAgo } from '../utils/dateIST';

const { WidgetModule } = NativeModules;

function spendOn(expenses: Transaction[], dayStr: string): number {
  return expenses
    .filter(e => (e.type ?? 'debit') === 'debit' && istDateString(new Date(e.date)) === dayStr)
    .reduce((sum, e) => sum + e.amount, 0);
}

function spendInMonth(expenses: Transaction[], monthStr: string): number {
  return expenses
    .filter(e => (e.type ?? 'debit') === 'debit' && istMonthString(new Date(e.date)) === monthStr)
    .reduce((sum, e) => sum + e.amount, 0);
}

// null means "no comparison data" (previous period had zero spend) — the widget
// hides the change pill in that case rather than showing a misleading 0%/∞%.
function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function syncWidget(expenses: Transaction[]): void {
  if (Platform.OS !== 'android' || !WidgetModule?.updateWidget) return;

  const todaySpend = spendOn(expenses, istDateString());
  const monthSpend = spendInMonth(expenses, istMonthString());
  const todayChangePct = pctChange(todaySpend, spendOn(expenses, istDateStringDaysAgo(1)));
  const monthChangePct = pctChange(monthSpend, spendInMonth(expenses, istMonthStringMonthsAgo(1)));

  WidgetModule.updateWidget(
    todaySpend,
    monthSpend,
    todayChangePct !== null,
    todayChangePct ?? 0,
    monthChangePct !== null,
    monthChangePct ?? 0,
  );
}
