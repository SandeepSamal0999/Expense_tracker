import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddExpenseScreen from '../screens/transactions/AddExpenseScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import HouseScreen from '../screens/house/HouseScreen';
import WorkersScreen from '../screens/workers/WorkersScreen';
import MaterialsScreen from '../screens/materials/MaterialsScreen';
import VendorsScreen from '../screens/vendors/VendorsScreen';
import { COLORS } from '../constants/colors';

type TabId =
  | 'Dashboard'
  | 'Transactions'
  | 'Analytics'
  | 'Budget'
  | 'Settings'
  | 'House'
  | 'Workers'
  | 'Materials'
  | 'Vendors';

// Analytics and Budget are reached from Dashboard's quick actions/insight banner
// instead of taking up bottom-tab slots.
const TAB_CONFIG: { id: TabId; label: string; icon: string }[] = [
  { id: 'Dashboard', label: 'Home', icon: '🏠' },
  { id: 'Transactions', label: 'Expenses', icon: '📋' },
  { id: 'Settings', label: 'Settings', icon: '⚙️' },
];

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('Dashboard');
  const [txScreen, setTxScreen] = useState<'list' | 'add'>('list');
  const [editTransaction, setEditTransaction] = useState<any>(undefined);
  const [addExpensePreset, setAddExpensePreset] = useState<'debit' | 'credit' | undefined>(
    undefined,
  );
  const [addExpenseStageId, setAddExpenseStageId] = useState<string | undefined>(undefined);
  const [addExpenseMaterialId, setAddExpenseMaterialId] = useState<string | undefined>(undefined);
  const [addExpenseVendorId, setAddExpenseVendorId] = useState<string | undefined>(undefined);

  const navigate = (target: string, params?: any) => {
    if (target === 'Transactions') {
      setActiveTab('Transactions');
      if (params?.screen === 'AddExpense') {
        setEditTransaction(params?.params?.transaction);
        setAddExpensePreset(params?.params?.presetType);
        setAddExpenseStageId(params?.params?.presetStageId);
        setAddExpenseMaterialId(params?.params?.presetMaterialId);
        setAddExpenseVendorId(params?.params?.presetVendorId);
        setTxScreen('add');
      } else {
        setTxScreen('list');
      }
    } else if (target === 'AddExpense') {
      setEditTransaction(params?.transaction);
      setAddExpensePreset(params?.presetType);
      setAddExpenseStageId(params?.presetStageId);
      setAddExpenseMaterialId(params?.presetMaterialId);
      setAddExpenseVendorId(params?.presetVendorId);
      setTxScreen('add');
    } else if (target === 'TransactionsList') {
      setTxScreen('list');
    } else {
      setActiveTab(target as TabId);
    }
  };

  const goBack = () => {
    if (activeTab === 'Transactions' && txScreen === 'add') {
      setTxScreen('list');
      setEditTransaction(undefined);
      setAddExpensePreset(undefined);
      setAddExpenseStageId(undefined);
      setAddExpenseMaterialId(undefined);
      setAddExpenseVendorId(undefined);
    }
  };

  const navigation = { navigate, goBack };

  // Android hardware back button / edge-swipe gesture both fire this event.
  // Without a listener, the OS default takes over and kills the app outright
  // with no confirmation — so intercept it: close a sub-screen first, then
  // return to Home, then finally confirm before actually exiting.
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'Transactions' && txScreen === 'add') {
        goBack();
        return true;
      }
      if (activeTab === 'Workers' || activeTab === 'Materials' || activeTab === 'Vendors') {
        setActiveTab('House');
        return true;
      }
      if (activeTab !== 'Dashboard') {
        setActiveTab('Dashboard');
        return true;
      }
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab, txScreen]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Transactions':
        if (txScreen === 'add') {
          return (
            <AddExpenseScreen
              navigation={{ ...navigation, goBack }}
              route={{
                params: editTransaction
                  ? { transaction: editTransaction }
                  : addExpensePreset ||
                    addExpenseStageId ||
                    addExpenseMaterialId ||
                    addExpenseVendorId
                  ? {
                      presetType: addExpensePreset,
                      presetStageId: addExpenseStageId,
                      presetMaterialId: addExpenseMaterialId,
                      presetVendorId: addExpenseVendorId,
                    }
                  : undefined,
              }}
            />
          );
        }
        return <TransactionsScreen navigation={navigation} />;
      case 'Analytics':
        return <AnalyticsScreen />;
      case 'Budget':
        return <BudgetScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'House':
        return <HouseScreen navigation={navigation} />;
      case 'Workers':
        return <WorkersScreen navigation={navigation} />;
      case 'Materials':
        return <MaterialsScreen navigation={navigation} />;
      case 'Vendors':
        return <VendorsScreen navigation={navigation} />;
      default:
        return <DashboardScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>

      <View style={styles.tabBar}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === 'Transactions') {
                  setTxScreen('list');
                  setEditTransaction(undefined);
                  setAddExpensePreset(undefined);
                  setAddExpenseStageId(undefined);
                  setAddExpenseMaterialId(undefined);
                  setAddExpenseVendorId(undefined);
                }
              }}
              activeOpacity={0.7}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
