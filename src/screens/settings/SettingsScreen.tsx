import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/colors';

export default function SettingsScreen() {
  const { state, logout } = useApp();
  const { user } = state;

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const handleSmsToggle = (val: boolean) => {
    if (val) {
      Alert.alert(
        'SMS Permission',
        'SMS reading requires native module integration. This will be enabled when the backend is connected.',
        [{ text: 'OK' }],
      );
      return;
    }
    setSmsEnabled(val);
  };

  const handleNotifToggle = (val: boolean) => {
    if (val) {
      Alert.alert(
        'Notification Access',
        'Notification reading requires native module integration. This will be enabled when the backend is connected.',
        [{ text: 'OK' }],
      );
      return;
    }
    setNotifEnabled(val);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.sectionLabel}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Daily Summary</Text>
            <Text style={styles.settingDesc}>
              Get a daily spending summary notification
            </Text>
          </View>
          <Switch
            value={dailySummary}
            onValueChange={setDailySummary}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            thumbColor={COLORS.text}
          />
        </View>

        <Text style={styles.sectionLabel}>Data</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert('Export', 'Data export will be available when backend is connected.')
          }>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Export Data</Text>
            <Text style={styles.settingDesc}>Download your expenses as CSV</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
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
  avatarText: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
  },
  profilePhone: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
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
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    color: COLORS.muted,
    fontSize: 18,
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
