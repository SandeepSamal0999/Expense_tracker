import { useEffect, useRef } from 'react';
import {
  NativeModules,
  DeviceEventEmitter,
  AppState,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { parseSmsToTransaction, parseNotificationToTransaction } from '../services/transactionParser';
import { Transaction } from '../types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const { SmsModule, NotificationModule } = NativeModules;

export function useAutoCapture(
  smsEnabled: boolean,
  notifEnabled: boolean,
  onTransaction: (tx: Transaction) => void,
) {
  const onTxRef = useRef(onTransaction);
  useEffect(() => { onTxRef.current = onTransaction; });

  const smsLock = useRef(false);
  const notifLock = useRef(false);

  const drainSms = async () => {
    if (smsLock.current || !SmsModule) return;
    smsLock.current = true;
    try {
      const raw: string = await SmsModule.getPendingSms();
      const list: { address: string; body: string; date: number }[] = JSON.parse(raw);
      if (list.length === 0) return;
      SmsModule.clearPendingSms();
      for (const sms of list) {
        const parsed = parseSmsToTransaction(sms);
        if (parsed) onTxRef.current({ id: generateId(), ...parsed });
      }
    } catch {}
    finally { smsLock.current = false; }
  };

  const drainNotifs = async () => {
    if (notifLock.current || !NotificationModule) return;
    notifLock.current = true;
    try {
      const raw: string = await NotificationModule.getPendingNotifications();
      const list: { package: string; title: string; text: string; date: number }[] = JSON.parse(raw);
      if (list.length === 0) return;
      NotificationModule.clearPendingNotifications();
      for (const notif of list) {
        const parsed = parseNotificationToTransaction(notif);
        if (parsed) onTxRef.current({ id: generateId(), ...parsed });
      }
    } catch {}
    finally { notifLock.current = false; }
  };

  // ─── SMS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!smsEnabled || Platform.OS !== 'android' || !SmsModule) return;

    // Ensure runtime permissions are granted (needed for SmsReceiver to work)
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]).catch(() => {});

    // Register listeners FIRST (synchronous) so no signal is ever missed
    const signalSub = DeviceEventEmitter.addListener('onSmsPending', drainSms);
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') drainSms();
    });

    // Then drain anything that arrived before this effect ran
    drainSms();

    return () => {
      signalSub.remove();
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smsEnabled]);

  // ─── Notifications ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!notifEnabled || Platform.OS !== 'android' || !NotificationModule) return;

    const signalSub = DeviceEventEmitter.addListener('onNotifPending', drainNotifs);
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') drainNotifs();
    });

    drainNotifs();

    return () => {
      signalSub.remove();
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifEnabled]);
}
