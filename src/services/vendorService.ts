import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vendor, VendorPayment } from '../types';

const VENDORS_KEY = '@expense_tracker_vendors';
const PAYMENTS_KEY = '@expense_tracker_vendor_payments';

// ─── Vendors ──────────────────────────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const data = await AsyncStorage.getItem(VENDORS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveVendors(vendors: Vendor[]): Promise<void> {
  await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
}

export async function addVendor(vendor: Omit<Vendor, 'id'>): Promise<Vendor[]> {
  const vendors = await getVendors();
  const updated = [...vendors, { ...vendor, id: Date.now().toString() }];
  await saveVendors(updated);
  return updated;
}

export async function updateVendor(id: string, patch: Partial<Vendor>): Promise<Vendor[]> {
  const vendors = await getVendors();
  const updated = vendors.map(v => (v.id === id ? { ...v, ...patch } : v));
  await saveVendors(updated);
  return updated;
}

export async function deleteVendor(id: string): Promise<Vendor[]> {
  const vendors = await getVendors();
  const updated = vendors.filter(v => v.id !== id);
  await saveVendors(updated);
  return updated;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<VendorPayment[]> {
  const data = await AsyncStorage.getItem(PAYMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePayments(payments: VendorPayment[]): Promise<void> {
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export async function addPayment(payment: Omit<VendorPayment, 'id'>): Promise<VendorPayment[]> {
  const payments = await getPayments();
  const updated = [...payments, { ...payment, id: Date.now().toString() }];
  await savePayments(updated);
  return updated;
}

export async function deletePayment(id: string): Promise<VendorPayment[]> {
  const payments = await getPayments();
  const updated = payments.filter(p => p.id !== id);
  await savePayments(updated);
  return updated;
}
