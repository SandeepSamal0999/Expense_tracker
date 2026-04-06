import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddExpenseScreen from '../screens/transactions/AddExpenseScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { COLORS } from '../constants/colors';
import { MainTabParamList, TransactionsStackParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TxStack = createNativeStackNavigator<TransactionsStackParamList>();

function TransactionsStack() {
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TxStack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </TxStack.Navigator>
  );
}

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Transactions: '📋',
  Analytics: '📊',
  Budget: '💰',
  Settings: '⚙️',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        options={{ tabBarLabel: 'Expenses' }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.cardBorder,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
});
