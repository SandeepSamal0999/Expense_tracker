import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { DailySummaryModule } = NativeModules;

const EXPENSES_KEY = '@expense_tracker_expenses';

/**
 * Headless JS task fired by DailySummaryHeadlessService (via AlarmManager).
 * Reads today's expenses from AsyncStorage, computes the total, and posts
 * a local notification via DailySummaryModule.sendSummaryNotification().
 */
const DailySummaryTask = async () => {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    const expenses: Array<{ date: string; amount: number; merchant: string }> =
      raw ? JSON.parse(raw) : [];

    const todayStr = new Date().toDateString();
    const todayExpenses = expenses.filter(
      e => new Date(e.date).toDateString() === todayStr,
    );

    const total = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const count = todayExpenses.length;

    let title: string;
    let body: string;

    if (count === 0) {
      title = 'Daily Summary';
      body = "You haven't recorded any expenses today. Stay on top of your spending!";
    } else {
      const formatted = total.toLocaleString('en-IN');
      title = `You spent ₹${formatted} today`;
      body =
        count === 1
          ? `1 transaction recorded today.`
          : `${count} transactions recorded today.`;

      // Add top merchant if available
      const merchantCounts: Record<string, number> = {};
      todayExpenses.forEach(e => {
        merchantCounts[e.merchant] = (merchantCounts[e.merchant] || 0) + 1;
      });
      const topMerchant = Object.entries(merchantCounts).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0];
      if (topMerchant && count > 1) {
        body += ` Largest at ${topMerchant}.`;
      }
    }

    if (DailySummaryModule) {
      await DailySummaryModule.sendSummaryNotification(title, body);
    }
  } catch (_) {
    // Silently fail — headless task must not crash
  }
};

export default DailySummaryTask;
