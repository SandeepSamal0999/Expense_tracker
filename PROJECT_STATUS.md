# Expense Tracker Frontend - Project Status

## Tech Stack
- **Framework:** React Native 0.84.1
- **Language:** TypeScript
- **React:** 19.2.3
- **State Management:** React Context + useReducer
- **Storage:** AsyncStorage (local persistence)
- **Navigation:** Custom JS-based (tab + stack)
- **Charts:** Custom View-based bar charts
- **Node:** 20+ (via nvm)
- **Target Platform:** Android (iOS limited due to SMS restrictions)

## Project Structure
```
src/
  types/index.ts                         # TypeScript interfaces
  constants/colors.ts                    # Theme colors, category metadata
  services/
    storageService.ts                    # AsyncStorage CRUD wrapper
    api.ts                               # Mock API stubs (ready for backend swap)
    seedData.ts                          # 15 sample transactions + 6 budgets
  context/
    AppContext.tsx                        # Global state (auth, expenses, budgets)
  navigation/
    RootNavigator.tsx                    # Auth check -> AuthStack or MainTabs
    AuthStack.tsx                        # Login / Signup flow
    MainTabs.tsx                         # Bottom tabs + transaction stack
    SimpleStack.tsx                      # Lightweight JS-based stack navigator
  screens/
    auth/LoginScreen.tsx                 # Email + password login
    auth/SignupScreen.tsx                # Name, email, phone, password signup
    dashboard/DashboardScreen.tsx        # Summary cards, top spending, recent txns
    transactions/TransactionsScreen.tsx  # Search, filters, grouped transaction list
    transactions/AddExpenseScreen.tsx    # Add/edit/delete expense form
    analytics/AnalyticsScreen.tsx        # Bar chart, category breakdown, top merchants
    budget/BudgetScreen.tsx              # Set budgets, progress bars, alerts
    settings/SettingsScreen.tsx          # Profile, toggles, logout
  components/
    TransactionRow.tsx                   # Single expense row with category icon
    MetricCard.tsx                       # KPI card (total, average, etc.)
    BarChart.tsx                         # Custom View-based bar chart
    CategoryPicker.tsx                   # Category selection grid
    SearchBar.tsx                        # Search input
    EmptyState.tsx                       # No-data placeholder
```

## Screens Implemented

| Screen | Status | Features |
|--------|--------|----------|
| Login | Done | Email/password, Google button (UI only), mock auth |
| Signup | Done | Name, email, phone, password, mock registration |
| Dashboard | Done | Greeting, month/today totals, top spending categories, recent 5 txns, FAB |
| Transactions | Done | Search, time filters (All/Today/Week/Month), category filters, grouped by date |
| Add/Edit Expense | Done | Amount, merchant, category picker, date, notes, delete option |
| Analytics | Done | Week/month toggle, bar chart, category breakdown, progress bars, top merchants |
| Budget | Done | Set category budgets, progress bars (green/yellow/red), over-budget alerts, modal |
| Settings | Done | Profile card, SMS toggle (UI), notification toggle (UI), daily summary, export (UI), logout |

## BRD Features Coverage

### Implemented
- [x] User authentication (mock - Login/Signup screens)
- [x] Manual expense entry with all fields (amount, category, notes, date)
- [x] Expense editing and deletion
- [x] Auto categorization setup (Food, Transport, Shopping, Entertainment, Health, Bills, Other)
- [x] Category-wise spending breakdown
- [x] Dashboard with daily/monthly summaries
- [x] Graphs & charts (custom bar chart)
- [x] Budget management with category limits
- [x] Budget alerts (visual indicators: green/yellow/red)
- [x] Search by merchant or note
- [x] Filter by date range and category
- [x] Spending trends (week vs month view)
- [x] Top merchants ranking
- [x] Settings screen with permission toggles (UI only)
- [x] Dark theme UI
- [x] Data persistence (AsyncStorage)
- [x] 15 seed transactions + 6 seed budgets for demo

### Not Yet Implemented
- [ ] SMS reading (requires native Android module + READ_SMS permission)
- [ ] Notification reading (requires NotificationListenerService)
- [ ] Auto expense creation from SMS/notifications
- [ ] SMS parser (extract amount, merchant from bank SMS)
- [ ] Real backend API integration (currently mock)
- [ ] Real authentication (OAuth, OTP)
- [ ] Daily summary notifications
- [ ] Budget alert push notifications
- [ ] Data export (CSV)
- [ ] ML-based categorization

## Dependencies Installed
### Production
- `react` 19.2.3
- `react-native` 0.84.1
- `react-native-safe-area-context` ^5.5.2
- `react-native-screens` ^4.24.0
- `@react-native-async-storage/async-storage` ^2.2.0
- `@react-navigation/native` ^7.2.2
- `@react-navigation/native-stack` ^7.14.10
- `@react-navigation/bottom-tabs` ^7.15.9

### Note
React Navigation packages are installed but **not used in JS** due to Fabric/new architecture compatibility issues. Navigation is handled by custom `SimpleStack.tsx` and `MainTabs.tsx` instead.

## Issues Encountered & Resolved
1. **AsyncStorage v3.x build failure** - KMP artifact `org.asyncstorage.shared_storage:storage-android:1.0.0` not found. Fixed by downgrading to v2.x.
2. **React 18 + RN 0.84 crash** - `Cannot read property 'S' of undefined`. RN 0.84 requires React 19.2.3. Fixed by upgrading React.
3. **react-native-screens crash with Fabric** - `createNativeStackNavigator` crashed on new architecture. Fixed by switching to custom JS-based navigation.
4. **SafeAreaProvider crash** - `getPaperRenderer` error with Fabric renderer. Fixed by replacing with plain `SafeAreaView` from react-native.
5. **Metro dying between sessions** - Background Metro process getting killed. Fixed by running `npx react-native run-android` which manages Metro lifecycle.
6. **ADB port forwarding lost** - `adb reverse` resets when adb daemon restarts. Must run `adb reverse tcp:8081 tcp:8081` after each reconnect.

## How to Run
```bash
# Ensure Node 20+ is active
nvm use 20

# Connect Android device with USB debugging enabled

# Build and run (starts Metro automatically)
npx react-native run-android

# If Metro disconnects, set port forwarding:
adb reverse tcp:8081 tcp:8081
```

## Backend Integration Guide
When the Node.js backend is ready, update `src/services/api.ts`:
- Replace mock functions with real `fetch()` calls to your API
- All screens already consume data through this service layer
- No screen code changes needed — only `api.ts` needs updating

## Next Steps
1. Add SMS reading native module for auto expense capture
2. Build Node.js backend with Express/NestJS
3. Implement real authentication (JWT/OAuth)
4. Connect frontend API stubs to real backend
5. Build release APK for standalone usage
6. Add push notifications for budget alerts

## Git Repository
**Remote:** https://github.com/SandeepSamal0999/Expense_tracker
**Branch:** main
