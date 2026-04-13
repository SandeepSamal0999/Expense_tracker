/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundSmsTask from './src/tasks/BackgroundSmsTask';
import DailySummaryTask from './src/tasks/DailySummaryTask';

AppRegistry.registerComponent(appName, () => App);

// Headless JS task: processes bank SMS when the app is not running.
// SmsReceiver (Kotlin) starts SmsHeadlessTaskService which fires this task.
AppRegistry.registerHeadlessTask('SmsProcessorTask', () => BackgroundSmsTask);

// Headless JS task: reads today's expenses and posts the daily summary notification.
// DailySummaryReceiver (AlarmManager) starts DailySummaryHeadlessService which fires this task.
AppRegistry.registerHeadlessTask('DailySummaryTask', () => DailySummaryTask);
