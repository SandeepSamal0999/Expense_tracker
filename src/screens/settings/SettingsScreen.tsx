import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/colors';
import ManageCategoriesScreen from './ManageCategoriesScreen';
import { exportBackup, importBackup } from '../../services/backupService';

const { NotificationModule, DailySummaryModule } = NativeModules;

const DAILY_SUMMARY_KEY = '@expense_tracker_daily_summary';
// Daily summary fires at 9:00 PM by default
const SUMMARY_HOUR = 21;
const SUMMARY_MINUTE = 0;

export default function SettingsScreen() {
  const { state, logout, updateSettings } = useApp();
  const { user, settings } = state;
  const { smsEnabled, notifEnabled } = settings;

  const [dailySummary, setDailySummary] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [batteryOptIgnored, setBatteryOptIgnored] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !NotificationModule) return;
    NotificationModule.isBatteryOptimizationIgnored()
      .then((ignored: boolean) => setBatteryOptIgnored(ignored))
      .catch(() => {});
  }, []);

  // Load saved daily summary preference
  useEffect(() => {
    AsyncStorage.getItem(DAILY_SUMMARY_KEY)
      .then(val => setDailySummary(val === 'true'))
      .catch(() => {});
  }, []);

  const handleSmsToggle = async (val: boolean) => {
    if (!val) {
      await updateSettings({ ...settings, smsEnabled: false });
      return;
    }
    if (Platform.OS !== 'android') return;
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    const ok =
      granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === 'granted' &&
      granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === 'granted';
    if (ok) {
      await updateSettings({ ...settings, smsEnabled: true });
    } else {
      Alert.alert(
        'Permission Denied',
        'SMS permission is required to auto-detect bank transactions.',
      );
    }
  };

  const handleNotifToggle = async (val: boolean) => {
    if (!val) {
      await updateSettings({ ...settings, notifEnabled: false });
      return;
    }
    if (Platform.OS !== 'android' || !NotificationModule) return;
    const enabled = await NotificationModule.isNotificationListenerEnabled();
    if (enabled) {
      await updateSettings({ ...settings, notifEnabled: true });
    } else {
      Alert.alert(
        'Notification Access Required',
        'You need to grant Notification Access to auto-detect UPI payments. This will open Android settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => NotificationModule.openNotificationSettings(),
          },
        ],
      );
    }
  };

  const handleBatteryOptimization = () => {
    if (Platform.OS !== 'android' || !NotificationModule) return;
    if (batteryOptIgnored) {
      Alert.alert(
        'Already Enabled',
        'Background tracking is already unrestricted. Transactions will be captured even when the app is closed.',
      );
      return;
    }
    Alert.alert(
      'Allow Background Tracking',
      'Many Android devices (Samsung, Xiaomi, etc.) stop apps from running in the background when you swipe them away. This prevents new transactions from being captured.\n\nTap "Allow" on the next screen to fix this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            NotificationModule.requestIgnoreBatteryOptimization();
            // Re-check status after a short delay so the toggle reflects any change
            setTimeout(async () => {
              try {
                const ignored = await NotificationModule.isBatteryOptimizationIgnored();
                setBatteryOptIgnored(ignored);
              } catch (_) {}
            }, 2000);
          },
        },
      ],
    );
  };

  const handleDailySummaryToggle = async (val: boolean) => {
    if (Platform.OS !== 'android' || !DailySummaryModule) {
      setDailySummary(val);
      return;
    }

    if (val) {
      // Request POST_NOTIFICATIONS permission on Android 13+
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any,
        );
        if (granted !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Allow notifications to receive the daily spending summary.',
          );
          return;
        }
      }
      DailySummaryModule.scheduleDailySummary(SUMMARY_HOUR, SUMMARY_MINUTE);
      await AsyncStorage.setItem(DAILY_SUMMARY_KEY, 'true');
      setDailySummary(true);
      Alert.alert(
        'Daily Summary Enabled',
        `You will receive a spending summary notification every day at ${SUMMARY_HOUR}:${String(SUMMARY_MINUTE).padStart(2, '0')} PM.`,
      );
    } else {
      DailySummaryModule.cancelDailySummary();
      await AsyncStorage.setItem(DAILY_SUMMARY_KEY, 'false');
      setDailySummary(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (showCategories) {
    return <ManageCategoriesScreen onBack={() => setShowCategories(false)} />;
  }

  return (
    <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            {user?.phone ? (
              <Text style={styles.profilePhone}>{user.phone}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Auto Capture</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>SMS Reading</Text>
            <Text style={styles.settingDesc}>
              Auto-detect expenses from bank SMS
            </Text>
          </View>
          <Switch
            value={smsEnabled}
            onValueChange={handleSmsToggle}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Notification Access</Text>
            <Text style={styles.settingDesc}>
              Read payment notifications from UPI apps
            </Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleNotifToggle}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>

        {Platform.OS === 'android' && (
          <TouchableOpacity style={styles.settingRow} onPress={handleBatteryOptimization}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Background Tracking</Text>
              <Text style={styles.settingDesc}>
                {batteryOptIgnored
                  ? 'Unrestricted — transactions captured even when app is closed'
                  : 'Restricted — tap to fix so transactions are captured when app is closed'}
              </Text>
            </View>
            <View style={[styles.badge, batteryOptIgnored ? styles.badgeGood : styles.badgeWarn]}>
              <Text style={[styles.badgeText, batteryOptIgnored ? styles.badgeTextGood : styles.badgeTextWarn]}>
                {batteryOptIgnored ? 'ON' : 'FIX'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Daily Summary</Text>
            <Text style={styles.settingDesc}>
              {dailySummary
                ? 'Daily summary at 9:00 PM — tap to disable'
                : 'Get a daily spending summary notification at 9 PM'}
            </Text>
          </View>
          <Switch
            value={dailySummary}
            onValueChange={handleDailySummaryToggle}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>

        <Text style={styles.sectionLabel}>Categories</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowCategories(true)}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Manage Categories</Text>
            <Text style={styles.settingDesc}>Add, edit or delete expense categories</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Data Backup</Text>

        <TouchableOpacity style={styles.settingRow} onPress={exportBackup}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Export Backup</Text>
            <Text style={styles.settingDesc}>Save all data to Google Drive, WhatsApp or email</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={() => { setImportText(''); setImportModal(true); }}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Import Backup</Text>
            <Text style={styles.settingDesc}>Restore data from a previous backup</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Expense Tracker v1.0.0</Text>
      </View>
    </ScrollView>

    {/* Import Backup Modal */}
    <Modal visible={importModal} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.importModal}>
          <Text style={styles.importTitle}>Import Backup</Text>
          <Text style={styles.importDesc}>
            Open your backup file, copy all the text, then paste it below.
          </Text>
          <TextInput
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
            placeholder="Paste backup JSON here..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={6}
          />
          <View style={styles.importActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setImportModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={async () => {
                if (!importText.trim()) return;
                const result = await importBackup(importText);
                setImportModal(false);
                Alert.alert(
                  result.success ? 'Restored!' : 'Failed',
                  result.message,
                  result.success
                    ? [{ text: 'OK', onPress: () => logout() }]
                    : [{ text: 'OK' }],
                );
              }}>
              <Text style={styles.saveText}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { color: COLORS.accent, fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  profileEmail: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  profilePhone: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  settingDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  arrow: { color: COLORS.muted, fontSize: 18 },
  logoutBtn: {
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  version: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 20 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeGood: { backgroundColor: '#0d2b1a', borderColor: '#22c55e' },
  badgeWarn: { backgroundColor: '#2b1a0d', borderColor: '#f97316' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextGood: { color: '#22c55e' },
  badgeTextWarn: { color: '#f97316' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  importModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  importTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  importDesc: { color: COLORS.muted, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  importInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 13,
    padding: 14,
    height: 140,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  importActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.muted, fontSize: 15 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});
