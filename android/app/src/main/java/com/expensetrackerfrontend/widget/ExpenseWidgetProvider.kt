package com.expensetrackerfrontend.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import com.expensetrackerfrontend.MainActivity
import com.expensetrackerfrontend.R
import kotlin.math.abs
import kotlin.math.roundToInt

class ExpenseWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        // Widget was resized — re-render so the tagline banner can show/hide to fit.
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    companion object {
        const val PREFS_NAME = "ExpenseWidgetData"
        const val KEY_TODAY = "widget_today_spend"
        const val KEY_MONTH = "widget_month_spend"
        const val KEY_UPDATED = "widget_last_updated"
        const val KEY_HAS_TODAY_CHANGE = "widget_has_today_change"
        const val KEY_TODAY_CHANGE = "widget_today_change_pct"
        const val KEY_HAS_MONTH_CHANGE = "widget_has_month_change"
        const val KEY_MONTH_CHANGE = "widget_month_change_pct"

        // Below this granted height, the bottom tagline banner is hidden to avoid clipping.
        private const val BANNER_MIN_HEIGHT_DP = 160

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val todaySpend = prefs.getFloat(KEY_TODAY, 0f)
            val monthSpend = prefs.getFloat(KEY_MONTH, 0f)
            val lastUpdated = prefs.getString(KEY_UPDATED, "") ?: ""
            val hasTodayChange = prefs.getBoolean(KEY_HAS_TODAY_CHANGE, false)
            val todayChangePct = prefs.getFloat(KEY_TODAY_CHANGE, 0f)
            val hasMonthChange = prefs.getBoolean(KEY_HAS_MONTH_CHANGE, false)
            val monthChangePct = prefs.getFloat(KEY_MONTH_CHANGE, 0f)

            val views = RemoteViews(context.packageName, R.layout.widget_expense)
            views.setTextViewText(R.id.widget_today_amount, formatAmount(todaySpend))
            views.setTextViewText(R.id.widget_month_amount, formatAmount(monthSpend))
            views.setTextViewText(
                R.id.widget_updated,
                if (lastUpdated.isNotEmpty()) "Updated $lastUpdated" else ""
            )

            applyChangePill(
                views,
                R.id.widget_today_change_row,
                R.id.widget_today_change,
                hasTodayChange,
                todayChangePct,
            )
            applyChangePill(
                views,
                R.id.widget_month_change_row,
                R.id.widget_month_change,
                hasMonthChange,
                monthChangePct,
            )

            val minHeight = appWidgetManager
                .getAppWidgetOptions(widgetId)
                ?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0) ?: 0
            views.setViewVisibility(
                R.id.widget_banner_row,
                if (minHeight >= BANNER_MIN_HEIGHT_DP) View.VISIBLE else View.GONE,
            )

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, piFlags)
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(widgetId, views)
        }

        // Spend down = green ("good"), spend up = red ("bad") — matches the app's own
        // spending semantics rather than plain up/down direction.
        private fun applyChangePill(
            views: RemoteViews,
            rowId: Int,
            pillId: Int,
            hasChange: Boolean,
            changePct: Float,
        ) {
            if (!hasChange) {
                views.setViewVisibility(rowId, View.GONE)
                return
            }
            views.setViewVisibility(rowId, View.VISIBLE)
            val decreased = changePct <= 0f
            val pct = abs(changePct).roundToInt()
            views.setTextViewText(pillId, "${if (decreased) "↓" else "↑"} $pct%")
            views.setInt(
                pillId,
                "setBackgroundResource",
                if (decreased) R.drawable.widget_pill_positive else R.drawable.widget_pill_negative,
            )
            views.setTextColor(
                pillId,
                Color.parseColor(if (decreased) "#00E5A0" else "#FF4D6A"),
            )
        }

        fun formatAmount(amount: Float): String = when {
            amount < 1_000f -> "₹${amount.toInt()}"
            amount < 1_00_000f -> "₹${"%.1f".format(amount / 1_000f)}k"
            else -> "₹${"%.1f".format(amount / 1_00_000f)}L"
        }
    }
}
