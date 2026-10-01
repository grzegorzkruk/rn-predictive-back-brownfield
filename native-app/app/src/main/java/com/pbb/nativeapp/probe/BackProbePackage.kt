package com.pbb.nativeapp.probe

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Handed to the brownfield ReactHost from NativeApp, next to the autolinked packages. */
class BackProbePackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == BackProbeModule.NAME) BackProbeModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        BackProbeModule.NAME to
            ReactModuleInfo(
                BackProbeModule.NAME,
                BackProbeModule::class.java.name,
                false,
                false,
                false,
                false,
            ),
    )
  }
}
