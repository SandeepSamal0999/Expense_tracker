package com.expensetrackerfrontend.notification

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray

class NotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NotificationModule"

    // Check if notification listener permission is granted
    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        val flat = Settings.Secure.getString(
            reactContext.contentResolver,
            "enabled_notification_listeners"
        ) ?: ""
        val enabled = flat.contains(reactContext.packageName)
        promise.resolve(enabled)
    }

    // Open Android Notification Access settings screen
    @ReactMethod
    fun openNotificationSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactContext.startActivity(intent)
    }

    // Check whether the app is currently excluded from battery optimization
    @ReactMethod
    fun isBatteryOptimizationIgnored(promise: Promise) {
        try {
            val pm = reactContext.getSystemService(android.os.PowerManager::class.java)
            promise.resolve(pm?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: false)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // Open the system dialog that lets the user exclude this app from battery optimization.
    // This is the key fix for OEM devices (Samsung, Xiaomi, etc.) that force-stop apps
    // when the user swipes them away from recents, preventing SmsReceiver from firing.
    @ReactMethod
    fun requestIgnoreBatteryOptimization() {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        } catch (_: Exception) {
            // Fallback: open the general battery optimization settings page
            try {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
            } catch (_: Exception) {}
        }
    }

    // Get notifications received while app was closed
    @ReactMethod
    fun getPendingNotifications(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("PendingNotifications", Context.MODE_PRIVATE)
            val json = prefs.getString("pending", "[]") ?: "[]"
            promise.resolve(json)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Clear pending notifications after processing
    @ReactMethod
    fun clearPendingNotifications() {
        val prefs = reactContext.getSharedPreferences("PendingNotifications", Context.MODE_PRIVATE)
        prefs.edit().putString("pending", "[]").apply()
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
