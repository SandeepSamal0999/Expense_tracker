package com.expensetrackerfrontend.notification

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class ExpenseNotificationService : NotificationListenerService() {

    private val targetPackages = setOf(
        "com.google.android.apps.nbuapps.gpay",
        "com.google.android.apps.tez",
        "com.phonepe.app",
        "net.one97.paytm",
        "in.org.npci.upiapp",
        "com.amazon.mShop.android.shopping",
        "com.mobikwik_new",
        "com.freecharge.android",
    )

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName ?: return
        if (packageName !in targetPackages) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        if (title.isBlank() && text.isBlank()) return

        val timestamp = sbn.postTime

        // Always save to SharedPreferences first (reliable even if JS isn't ready yet)
        savePending(packageName, title, text, timestamp)

        // Signal JS to drain SharedPreferences (safe if app not running)
        notifyJs()
    }

    private fun savePending(pkg: String, title: String, text: String, timestamp: Long) {
        val prefs = getSharedPreferences("PendingNotifications", MODE_PRIVATE)
        val existing = JSONArray(prefs.getString("pending", "[]"))
        existing.put(JSONObject().apply {
            put("package", pkg)
            put("title", title)
            put("text", text)
            put("date", timestamp)
        })
        prefs.edit().putString("pending", existing.toString()).apply()
    }

    private fun notifyJs() {
        try {
            val reactContext = (applicationContext as? ReactApplication)
                ?.reactHost?.currentReactContext ?: return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onNotifPending", null)
        } catch (_: Exception) {}
    }
}
