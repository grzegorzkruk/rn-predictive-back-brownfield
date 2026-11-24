package com.pbb.brownfieldlib

import android.app.Application
import com.callstack.reactnativebrownfield.OnJSBundleLoaded
import com.callstack.reactnativebrownfield.ReactNativeBrownfield
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage

/**
 * The only React Native entry point the native app is meant to touch.
 *
 * Same shape as the library template in the brownfield docs, with two additions:
 *
 *   - `useDevSupport`. React Native asks Metro for the bundle when it is true and falls back to
 *     the packaged bundle inside this AAR when Metro is unreachable, so the same AAR works with
 *     and without `yarn start`. The native app cannot see a BuildConfig here — it does not depend
 *     on this Gradle module, only on the published AAR — so the caller passes its own.
 *   - `extraPackages`. The native app cannot add a native module to the autolinked list, since
 *     that list is generated in ../android from its own node_modules. A host app that wants to
 *     talk to its JavaScript has to hand the package in, which is what this parameter is for.
 */
object ReactNativeHostManager {
    fun initialize(
        application: Application,
        onJSBundleLoaded: OnJSBundleLoaded? = null,
    ) {
        initialize(application, useDevSupport = false, onJSBundleLoaded = onJSBundleLoaded)
    }

    @JvmOverloads
    fun initialize(
        application: Application,
        useDevSupport: Boolean,
        onJSBundleLoaded: OnJSBundleLoaded? = null,
        extraPackages: List<ReactPackage> = emptyList(),
    ) {
        // react-native-brownfield 6.x runs initialization once and, on a repeated call, only
        // passes the callback the timings of the bundle that already loaded.
        val options =
            hashMapOf<String, Any>(
                "packages" to PackageList(application).packages + extraPackages,
                "mainModuleName" to "index",
                "bundleAssetPath" to "index.android.bundle",
                "useDeveloperSupport" to useDevSupport,
            )
        ReactNativeBrownfield.initialize(application, options, onJSBundleLoaded)
    }
}
