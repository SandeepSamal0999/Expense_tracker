package com.expensetrackerfrontend.sms

import android.Manifest
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsModule"

    // Read recent SMS from inbox (called on app start to catch up on missed messages)
    @ReactMethod
    fun readRecentSms(count: Int, promise: Promise) {
        if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
            return
        }
        try {
            val messages = Arguments.createArray()
            val uri = Uri.parse("content://sms/inbox")
            val cursor: Cursor? = reactContext.contentResolver.query(
                uri,
                arrayOf("_id", "address", "body", "date"),
                null, null,
                "date DESC LIMIT $count"
            )
            cursor?.use {
                while (it.moveToNext()) {
                    val map = Arguments.createMap()
                    map.putString("id", it.getString(it.getColumnIndexOrThrow("_id")))
                    map.putString("address", it.getString(it.getColumnIndexOrThrow("address")))
                    map.putString("body", it.getString(it.getColumnIndexOrThrow("body")))
                    map.putDouble("date", it.getLong(it.getColumnIndexOrThrow("date")).toDouble())
                    messages.pushMap(map)
                }
            }
            promise.resolve(messages)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message)
        }
    }

    // Get SMS received while app was closed (stored by SmsReceiver)
    @ReactMethod
    fun getPendingSms(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("PendingSms", android.content.Context.MODE_PRIVATE)
            val json = prefs.getString("pending", "[]") ?: "[]"
            promise.resolve(json)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Clear pending SMS after processing
    @ReactMethod
    fun clearPendingSms() {
        val prefs = reactContext.getSharedPreferences("PendingSms", android.content.Context.MODE_PRIVATE)
        prefs.edit().putString("pending", "[]").apply()
    }

    // Check if READ_SMS permission is granted
    @ReactMethod
    fun hasPermission(promise: Promise) {
        val granted = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) ==
                PackageManager.PERMISSION_GRANTED
        promise.resolve(granted)
    }

    // Required for React Native event emitter
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
