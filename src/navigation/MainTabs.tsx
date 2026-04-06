import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddExpenseScreen from '../screens/transactions/AddExpenseScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { COLORS } from '../constants/colors';

type TabId = 'Dashboard' | 'Transactions' | 'Analytics' | 'Budget' | 'Settings';

const TAB_CONFIG: { id: TabId; label: string; icon: string }[] = [
  { id: 'Dashboard', label: 'Home', icon: '🏠' },
  { id: 'Transactions', label: 'Expenses', icon: '📋' },
  { id: 'Analytics', label: 'Analytics', icon: '📊' },
  { id: 'Budget', label: 'Budget', icon: '💰' },
  { id: 'Settings', label: 'Settings', icon: '⚙️' },
];

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('Dashboard');
  const [txScreen, setTxScreen] = useState<'list' | 'add'>('list');
  const [editTransaction, setEditTransaction] = useState<any>(undefined);

  const navigate = (target: string, params?: any) => {
    if (target === 'Transactions') {
      setActiveTab('Transactions');
      if (params?.screen === 'AddExpense') {
        setEditTransaction(params?.params?.transaction);
        setTxScreen('add');
      } else {
        setTxScreen('list');
      }
    } else if (target === 'AddExpense') {
      setEditTransaction(params?.transaction);
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
    }
  };

  const navigation = { navigate, goBack };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Transactions':
        if (txScreen === 'add') {
          return (
            <AddExpenseScreen
              navigation={{ ...navigation, goBack }}
              route={{ params: editTransaction ? { transaction: editTransaction } : undefined }}
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
