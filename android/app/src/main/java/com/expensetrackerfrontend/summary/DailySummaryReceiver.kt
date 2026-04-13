package com.expensetrackerfrontend.summary

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.HeadlessJsTaskService

/**
 * Receives the daily alarm from AlarmManager and starts DailySummaryHeadlessService
 * so the JS task can read today's expenses and post a local notification.
 */
class DailySummaryReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        HeadlessJsTaskService.acquireWakeLockNow(context)
        val serviceIntent = Intent(context, DailySummaryHeadlessService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
