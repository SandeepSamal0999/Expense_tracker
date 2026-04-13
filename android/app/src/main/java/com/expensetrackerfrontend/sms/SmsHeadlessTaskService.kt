package com.expensetrackerfrontend.sms

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
 * Runs the JS "SmsProcessorTask" headless task when the app is not in the foreground.
 * This allows SMS transactions to be parsed and saved to AsyncStorage even when the
 * user has swiped the app away from recents.
 *
 * On Android 8+ (Oreo), background services must be started as foreground services.
 * We post a silent, minimal notification for the brief duration of processing and
 * stop it as soon as the headless task finishes.
 */
class SmsHeadlessTaskService : HeadlessJsTaskService() {

    companion object {
        private const val CHANNEL_ID = "sms_bg_processing"
        private const val NOTIFICATION_ID = 9001
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
                "Background Processing",
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
            .setContentText("Detecting transactions...")
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
            "SmsProcessorTask",
            Arguments.createMap(),
            5000,  // timeout ms — plenty of time to parse SMS and write AsyncStorage
            true,  // also allowed when app is in foreground (safe to call anytime)
        )
    }
}
