package com.expensetrackerfrontend.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        var saved = false
        for (sms in messages) {
            val address = sms.originatingAddress ?: ""
            val body = sms.messageBody ?: continue
            val date = sms.timestampMillis
            savePending(context, address, body, date)
            saved = true
        }

        // Signal JS to drain SharedPreferences (fire-and-forget, safe if app not running)
        if (saved) notifyJs(context)
    }

    private fun savePending(context: Context, address: String, body: String, date: Long) {
        val prefs = context.getSharedPreferences("PendingSms", Context.MODE_PRIVATE)
        val existing = JSONArray(prefs.getString("pending", "[]"))
        existing.put(JSONObject().apply {
            put("address", address)
            put("body", body)
            put("date", date)
        })
        prefs.edit().putString("pending", existing.toString()).apply()
    }

    private fun notifyJs(context: Context) {
        try {
            val reactContext = (context.applicationContext as? ReactApplication)
                ?.reactHost?.currentReactContext ?: return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onSmsPending", null)
        } catch (_: Exception) {}
    }
}
