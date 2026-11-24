package com.pbb.nativeapp

import android.os.Bundle
import com.callstack.reactnativebrownfield.ReactNativeBrownfield
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * Screen 2: a full-screen React Native screen.
 *
 * It is a real ReactActivity rather than an activity hosting a ReactNativeFragment, because
 * ReactActivity is the only surface that the BackHandler `intercept` option reaches. The
 * Application is not a ReactApplication, so the delegate takes the ReactHost from the
 * brownfield library instead.
 */
class RNActivity : ReactActivity() {

  override fun getMainComponentName(): String = MAIN_COMPONENT

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, MAIN_COMPONENT) {
        override fun getReactHost(): ReactHost = ReactNativeBrownfield.shared.reactHost

        override fun getLaunchOptions(): Bundle =
            Bundle().apply {
              putString(
                  "initialOwnership",
                  intent?.getStringExtra(EXTRA_INITIAL_OWNERSHIP) ?: "auto",
              )
            }
      }

  companion object {
    /** `name` in app.json. */
    const val MAIN_COMPONENT = "RNPredictiveBackBrownfield"

    /** "unset" opens the screen with its back listener added without the `intercept` option. */
    const val EXTRA_INITIAL_OWNERSHIP = "initialOwnership"
  }
}
