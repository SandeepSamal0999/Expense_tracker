package com.expensetrackerfrontend.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetModule"

    @ReactMethod
    fun updateWidget(
        todaySpend: Double,
        monthSpend: Double,
        hasTodayChange: Boolean,
        todayChangePct: Double,
        hasMonthChange: Boolean,
        monthChangePct: Double,
    ) {
        val context = reactContext.applicationContext
        val prefs = context.getSharedPreferences(ExpenseWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())

        prefs.edit()
            .putFloat(ExpenseWidgetProvider.KEY_TODAY, todaySpend.toFloat())
            .putFloat(ExpenseWidgetProvider.KEY_MONTH, monthSpend.toFloat())
            .putString(ExpenseWidgetProvider.KEY_UPDATED, timeStr)
            .putBoolean(ExpenseWidgetProvider.KEY_HAS_TODAY_CHANGE, hasTodayChange)
            .putFloat(ExpenseWidgetProvider.KEY_TODAY_CHANGE, todayChangePct.toFloat())
            .putBoolean(ExpenseWidgetProvider.KEY_HAS_MONTH_CHANGE, hasMonthChange)
            .putFloat(ExpenseWidgetProvider.KEY_MONTH_CHANGE, monthChangePct.toFloat())
            .apply()

        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, ExpenseWidgetProvider::class.java))
        for (id in ids) {
            ExpenseWidgetProvider.updateWidget(context, manager, id)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
