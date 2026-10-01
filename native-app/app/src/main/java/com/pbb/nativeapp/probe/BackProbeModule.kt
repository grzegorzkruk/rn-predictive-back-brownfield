package com.pbb.nativeapp.probe

import android.content.Intent
import android.os.Build
import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.pbb.nativeapp.NativeHostActivity

/**
 * What JS needs from the native app: a few facts about the device and classpath, and a way to
 * open screen 3. The host's back events reach JS as device events from [NativeHostActivity].
 */
@ReactModule(name = BackProbeModule.NAME)
class BackProbeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  override fun getConstants(): Map<String, Any> =
      mapOf(
          "targetSdk" to reactApplicationContext.applicationInfo.targetSdkVersion,
          "deviceSdk" to Build.VERSION.SDK_INT,
          "activityHasProgressCallbacks" to hasProgressCallbacks(),
      )

  @ReactMethod
  fun openNativeHost() {
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity ?: return@runOnUiThread
      activity.startActivity(Intent(activity, NativeHostActivity::class.java))
    }
  }

  companion object {
    const val NAME = "BackProbe"

    private fun hasProgressCallbacks(): Boolean =
        try {
          OnBackPressedCallback::class
              .java
              .getMethod("handleOnBackProgressed", BackEventCompat::class.java)
          true
        } catch (_: NoSuchMethodException) {
          false
        }
  }
}
