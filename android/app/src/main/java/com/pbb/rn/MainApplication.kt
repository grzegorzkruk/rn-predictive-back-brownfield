package com.pbb.rn

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

/**
 * Used only while building the bundle. This Application never runs on a device: the APK
 * the device runs is ../native-app, and that app builds its ReactHost through
 * com.pbb.brownfieldlib.ReactNativeHostManager.
 *
 * It is still worth keeping the two next to each other, because the settings that matter
 * for back handling — new architecture, Hermes, and the appKey — have to match, and this
 * module is where the autolinked package list is generated.
 */
class MainApplication : Application(), ReactApplication {
    override val reactHost: ReactHost by lazy(LazyThreadSafetyMode.NONE) {
        getDefaultReactHost(
            context = applicationContext,
            packageList = PackageList(this).packages,
        )
    }

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
    }
}
