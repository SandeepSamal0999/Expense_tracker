package com.expensetrackerfrontend.summary

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Runs the JS "DailySummaryTask" headless task when triggered by the daily AlarmManager alarm.
 * Requires a foreground service notification on Android 8+.
 */
class DailySummaryHeadlessService : HeadlessJsTaskService() {

    companion object {
        private const val CHANNEL_ID = "daily_summary_bg"
        private const val NOTIFICATION_ID = 9002
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            promoteForeground()
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun promoteForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Daily Summary Processing",
                NotificationManager.IMPORTANCE_MIN,
            ).apply {
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Expense Tracker")
            .setContentText("Preparing daily summary...")
            .setSmallIcon(android.R.drawable.ic_popup_sync)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        if (intent == null) return null
        return HeadlessJsTaskConfig(
            "DailySummaryTask",
            Arguments.createMap(),
            10000, // 10 seconds — enough to read AsyncStorage and post notification
            false, // do NOT run when app is in foreground; the app handles it directly
        )
    }
}
