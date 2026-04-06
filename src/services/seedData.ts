import { Transaction, Budget } from '../types';

const today = new Date();
const fmt = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return fmt(d);
};

const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: 's1', merchant: 'Swiggy', amount: 245, category: 'Food', date: daysAgo(0), notes: 'Lunch order', source: 'SMS', method: 'UPI' },
  { id: 's2', merchant: 'Uber', amount: 120, category: 'Transport', date: daysAgo(0), notes: 'Office commute', source: 'Notification', method: 'UPI' },
  { id: 's3', merchant: 'Amazon', amount: 1499, category: 'Shopping', date: daysAgo(1), notes: 'Headphones', source: 'SMS', method: 'UPI' },
  { id: 's4', merchant: 'Netflix', amount: 649, category: 'Entertainment', date: daysAgo(1), notes: 'Monthly subscription', source: 'SMS', method: 'UPI' },
  { id: 's5', merchant: 'Zomato', amount: 380, category: 'Food', date: daysAgo(2), notes: 'Dinner', source: 'Notification', method: 'UPI' },
  { id: 's6', merchant: 'Apollo Pharmacy', amount: 560, category: 'Health', date: daysAgo(2), notes: 'Medicines', source: 'SMS', method: 'UPI' },
  { id: 's7', merchant: 'Electricity Bill', amount: 2100, category: 'Bills', date: daysAgo(3), notes: 'Monthly electricity', source: 'SMS', method: 'UPI' },
  { id: 's8', merchant: 'Rapido', amount: 85, category: 'Transport', date: daysAgo(3), notes: 'Bike ride', source: 'Notification', method: 'UPI' },
  { id: 's9', merchant: 'McDonald\'s', amount: 320, category: 'Food', date: daysAgo(4), notes: 'Snacks', source: 'Manual', method: 'Manual' },
  { id: 's10', merchant: 'Flipkart', amount: 899, category: 'Shopping', date: daysAgo(5), notes: 'Phone case', source: 'SMS', method: 'UPI' },
  { id: 's11', merchant: 'Ola', amount: 210, category: 'Transport', date: daysAgo(5), notes: 'Airport drop', source: 'Notification', method: 'UPI' },
  { id: 's12', merchant: 'Starbucks', amount: 450, category: 'Food', date: daysAgo(6), notes: 'Coffee meeting', source: 'Manual', method: 'Manual' },
  { id: 's13', merchant: 'Gym membership', amount: 1500, category: 'Health', date: daysAgo(7), notes: 'Monthly gym', source: 'Manual', method: 'Manual' },
  { id: 's14', merchant: 'Jio Recharge', amount: 299, category: 'Bills', date: daysAgo(8), notes: 'Mobile recharge', source: 'SMS', method: 'UPI' },
  { id: 's15', merchant: 'BookMyShow', amount: 500, category: 'Entertainment', date: daysAgo(9), notes: 'Movie tickets', source: 'Notification', method: 'UPI' },
];

export const SEED_BUDGETS: Budget[] = [
  { id: 'b1', category: 'Food', limit: 5000, month: currentMonth },
  { id: 'b2', category: 'Transport', limit: 3000, month: currentMonth },
  { id: 'b3', category: 'Shopping', limit: 4000, month: currentMonth },
  { id: 'b4', category: 'Entertainment', limit: 2000, month: currentMonth },
  { id: 'b5', category: 'Health', limit: 3000, month: currentMonth },
  { id: 'b6', category: 'Bills', limit: 5000, month: currentMonth },
];
