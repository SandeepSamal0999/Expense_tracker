package com.expensetrackerfrontend

import android.app.Application
import com.expensetrackerfrontend.notification.NotificationPackage
import com.expensetrackerfrontend.sms.SmsPackage
import com.expensetrackerfrontend.summary.DailySummaryPackage
import com.expensetrackerfrontend.widget.WidgetPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(SmsPackage())
          add(NotificationPackage())
          add(DailySummaryPackage())
          add(WidgetPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
