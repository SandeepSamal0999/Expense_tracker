package com.expensetrackerfrontend.notification

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NotificationPackage : ReactPackage {
    @Suppress("DEPRECATION")
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(NotificationModule(reactContext))

    @Suppress("DEPRECATION")
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
