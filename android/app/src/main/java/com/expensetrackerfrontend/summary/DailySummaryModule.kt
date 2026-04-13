package com.expensetrackerfrontend.summary

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

class DailySummaryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val ALARM_REQUEST_CODE = 7001
        const val SUMMARY_CHANNEL_ID = "daily_spending_summary"
        const val SUMMARY_NOTIFICATION_ID = 7002
    }

    override fun getName() = "DailySummaryModule"

    /**
     * Schedule (or reschedule) the daily summary alarm.
     * @param hour   0-23
     * @param minute 0-59
     */
    @ReactMethod
    fun scheduleDailySummary(hour: Int, minute: Int) {
        ensureSummaryChannel()

        val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = buildPendingIntent()

        // Cancel any previous alarm first
        alarmManager.cancel(pendingIntent)

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            // If the time has already passed today, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            // Fallback to inexact repeating — still fires daily, just not at the exact millisecond
            alarmManager.setInexactRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                AlarmManager.INTERVAL_DAY,
                pendingIntent,
            )
        } else {
            alarmManager.setRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                AlarmManager.INTERVAL_DAY,
                pendingIntent,
            )
        }
    }

    @ReactMethod
    fun cancelDailySummary() {
        val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(buildPendingIntent())
    }

    /**
     * Post the actual summary notification. Called from JS (DailySummaryTask).
     */
    @ReactMethod
    fun sendSummaryNotification(title: String, body: String) {
        ensureSummaryChannel()

        val notification = NotificationCompat.Builder(reactContext, SUMMARY_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(SUMMARY_NOTIFICATION_ID, notification)
    }

    private fun buildPendingIntent(): PendingIntent {
        val intent = Intent(reactContext, DailySummaryReceiver::class.java)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getBroadcast(reactContext, ALARM_REQUEST_CODE, intent, flags)
    }

    private fun ensureSummaryChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                SUMMARY_CHANNEL_ID,
                "Daily Spending Summary",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "Daily notification showing today's spending"
                enableLights(true)
                enableVibration(false)
            }
            val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
