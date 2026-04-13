import { useEffect, useRef } from 'react';
import { Transaction, Budget } from '../types';

/**
 * Fires `onAlert` the first time a category's monthly budget crosses 80% or 100%
 * after a new expense is added. Doesn't fire on initial app load or on deletes.
 */
export function useBudgetAlert(
  expenses: Transaction[],
  budgets: Budget[],
  onAlert: (category: string, pct: number) => void,
) {
  const hasInitialized = useRef(false);
  const prevLengthRef = useRef(0);
  // Tracks thresholds already alerted this session: "Food_80", "Food_100"
  const alertedRef = useRef(new Set<string>());

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentBudgets = budgets.filter(b => b.month === currentMonth);

    const getSpentByCategory = () => {
      const map: Record<string, number> = {};
      expenses
        .filter(e => e.date.startsWith(currentMonth))
        .forEach(e => {
          map[e.category] = (map[e.category] || 0) + e.amount;
        });
      return map;
    };

    if (!hasInitialized.current) {
      // First load — mark existing exceeded thresholds as already alerted
      // so the user doesn't get a flood of alerts just for opening the app.
      hasInitialized.current = true;
      prevLengthRef.current = expenses.length;
      const spentByCategory = getSpentByCategory();
      currentBudgets.forEach(b => {
        const pct = ((spentByCategory[b.category] ?? 0) / b.limit) * 100;
        if (pct >= 80) alertedRef.current.add(`${b.category}_80`);
        if (pct >= 100) alertedRef.current.add(`${b.category}_100`);
      });
      return;
    }

    // Only check when a new expense was added (not deleted)
    if (expenses.length <= prevLengthRef.current) {
      prevLengthRef.current = expenses.length;
      return;
    }
    prevLengthRef.current = expenses.length;

    if (currentBudgets.length === 0) return;

    const spentByCategory = getSpentByCategory();

    currentBudgets.forEach(budget => {
      const spent = spentByCategory[budget.category] ?? 0;
      const pct = (spent / budget.limit) * 100;

      const key100 = `${budget.category}_100`;
      const key80 = `${budget.category}_80`;

      if (pct >= 100 && !alertedRef.current.has(key100)) {
        alertedRef.current.add(key100);
        onAlert(budget.category, Math.round(pct));
      } else if (pct >= 80 && !alertedRef.current.has(key80)) {
        alertedRef.current.add(key80);
        onAlert(budget.category, Math.round(pct));
      }
    });
  }, [expenses, budgets]);
}
