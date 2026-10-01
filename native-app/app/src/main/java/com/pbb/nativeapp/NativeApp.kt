package com.pbb.nativeapp

import android.app.Application
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.pbb.brownfieldlib.ReactNativeHostManager
import com.pbb.nativeapp.probe.BackProbePackage

/**
 * The React Native initialiser for a brownfield app: one call in Application.onCreate, before
 * any activity touches React Native.
 *
 * Unlike a plain React Native app, this Application is deliberately not a `ReactApplication`.
 * Nothing here exposes a `ReactHost`; the brownfield library owns it and hands surfaces to the
 * activities through `ReactNativeBrownfield.shared`. That is the whole point of the demo — a
 * real host app does not implement React interfaces in its own Application class.
 *
 * `DefaultHardwareBackBtnHandler` is implemented anyway, see [NativeApp] below.
 */
class NativeApp : Application(), DefaultHardwareBackBtnHandler {

  override fun onCreate() {
    super.onCreate()
    ReactNativeHostManager.initialize(
        application = this,
        // BuildConfig.DEBUG of *this* module, not of the AAR. The native app cannot read the
        // library's BuildConfig — it only sees the published artifact — so the flag travels
        // as a parameter. True means "ask Metro for the bundle", which is what
        // `yarn native:install -PuseMetro=true` is for.
        useDevSupport = BuildConfig.USE_METRO,
        extraPackages = listOf(BackProbePackage(this)),
    )
  }

  /**
   * A back press that nothing in React Native wanted.
   *
   * `ReactDelegateWrapper` (brownfield) passes a handler like this into
   * `ReactHost.onHostResume(activity, backHandler)`, and RN calls it when JS returned false from
   * `hardwareBackPress`. On a host activity that is not a ReactActivity — the embedded fragment's
   * case — the activity has to play the part, otherwise the default is to finish whatever
   * activity React Native last saw.
   *
   * Nothing in this demo calls it: [NativeHostActivity] owns back through its own callback and
   * finishes itself when it decides to. It is here so the behaviour is visible rather than
   * implicit.
   */
  override fun invokeDefaultOnBackPressed() {
    android.util.Log.w("BackProbe", "RN asked for the default back handler; no activity finishes here")
  }
}
