package com.pbb.nativeapp

import android.app.Application
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsProvider
import com.pbb.brownfieldlib.ReactNativeHostManager
import com.pbb.nativeapp.probe.BackProbePackage

/**
 * The React Native initialiser for a brownfield app: one call in Application.onCreate, before
 * any activity touches React Native.
 *
 * This Application is deliberately not a `ReactApplication`. The brownfield library owns the
 * `ReactHost` and hands it out through `ReactNativeBrownfield.shared`, which is how a real host
 * app is set up. [RNActivity] reads the host from there instead of from the Application.
 */
class NativeApp : Application() {

  override fun onCreate() {
    super.onCreate()
    ReactNativeHostManager.initialize(
        application = this,
        // BuildConfig of *this* module, not of the AAR. The native app cannot read the
        // library's BuildConfig, so the flag travels as a parameter. True means "ask Metro for
        // the bundle", which is what `yarn native:install -PuseMetro=true` is for.
        useDevSupport = BuildConfig.USE_METRO,
        extraPackages = listOf(BackProbePackage()),
    )
    // The demo needs the new predictive back behavior, which is behind a feature flag.
    // It goes after initialize and uses dangerouslyForceOverride, because a plain override
    // throws if React Native has already set its default flags.
    ReactNativeFeatureFlags.dangerouslyForceOverride(
        object :
            ReactNativeFeatureFlagsProvider by ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android() {
          override fun enablePredictiveBackAndroid(): Boolean = true
        })
  }
}
