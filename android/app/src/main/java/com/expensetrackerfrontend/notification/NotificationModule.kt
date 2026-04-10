package com.expensetrackerfrontend.notification

import android.content.ComponentName
import android.content.Context
import android.content.Intent
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
