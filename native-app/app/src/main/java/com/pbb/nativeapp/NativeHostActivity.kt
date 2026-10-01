package com.pbb.nativeapp

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import androidx.activity.OnBackPressedDispatcher
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentContainerView
import com.callstack.reactnativebrownfield.ReactNativeBrownfield
import com.callstack.reactnativebrownfield.ReactNativeFragment
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.pbb.nativeapp.NativeUi.button
import com.pbb.nativeapp.NativeUi.dp
import com.pbb.nativeapp.NativeUi.label
import com.pbb.nativeapp.NativeUi.roundedBackground

/**
 * Screen 3: native chrome with a brownfield [ReactNativeFragment] filling the rest.
 *
 * The fragment is not a ReactActivity, so `BackHandler.setInterceptEnabled` does nothing here.
 * Who gets the back gesture is decided by the callbacks on this activity's dispatcher, and the
 * host picks one of three modes:
 *
 * - [Mode.FRAGMENT]: stock react-native-brownfield. `ReactNativeBrownfield.createView` adds an
 *   always-enabled callback for the fragment. It claims every swipe: no system animation, no
 *   progress, and a commit becomes JS `hardwareBackPress`.
 * - [Mode.SYSTEM]: the host turns that callback off. The system animates this activity away and
 *   JS never hears about it.
 * - [Mode.HOST]: the host's own callback owns the swipe. It gets the activity 1.8 progress
 *   callbacks, animates its own content, forwards progress to JS, and forwards the commit to the
 *   fragment as `hardwareBackPress`.
 *
 * In FRAGMENT and HOST modes JS decides what a commit does: returning true from
 * `hardwareBackPress` keeps the screen, returning false lands in [invokeDefaultOnBackPressed].
 */
class NativeHostActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {

  enum class Mode(val js: String, val title: String) {
    FRAGMENT("fragment", "Fragment (stock)"),
    SYSTEM("system", "System"),
    HOST("host", "Host + progress"),
  }

  private var mode = Mode.FRAGMENT
  private lateinit var stateLabel: TextView
  private lateinit var content: View
  private val modeButtons = mutableMapOf<Mode, Button>()

  private val hostCallback =
      object : OnBackPressedCallback(false) {
        override fun handleOnBackStarted(backEvent: BackEventCompat) {
          onProgress("started", backEvent.progress)
        }

        override fun handleOnBackProgressed(backEvent: BackEventCompat) {
          onProgress("progress", backEvent.progress)
        }

        override fun handleOnBackCancelled() {
          onProgress("cancelled", 0f)
          resetContent()
        }

        override fun handleOnBackPressed() {
          onProgress("committed", 1f)
          forwardCommitToFragment()
        }
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(buildContent())
    onBackPressedDispatcher.addCallback(this, hostCallback)
    if (savedInstanceState == null) {
      supportFragmentManager
          .beginTransaction()
          .add(R.id.rn_fragment_container, ReactNativeFragment.createReactNativeFragment(EMBED))
          .commit()
    }
  }

  override fun onResume() {
    super.onResume()
    // The fragment's callback is re-added each time its view starts, so the mode is re-applied
    // whenever this screen comes back.
    applyMode()
  }

  /**
   * React Native calls this when JS did not handle `hardwareBackPress`. It is the activity's
   * implementation, not brownfield's, because ReactDelegate passes the host activity to
   * `ReactHost.onHostResume` when the activity implements [DefaultHardwareBackBtnHandler].
   */
  override fun invokeDefaultOnBackPressed() {
    Log.i(TAG, "JS released the commit, finishing")
    finish()
  }

  fun setMode(next: Mode) {
    mode = next
    applyMode()
    emit("HostBackMode", next.js)
  }

  private fun applyMode() {
    hostCallback.isEnabled = mode == Mode.HOST
    val fragmentCallbacks = fragmentCallbacks()
    fragmentCallbacks.forEach { it.isEnabled = mode == Mode.FRAGMENT }
    modeButtons.forEach { (m, b) -> b.background = roundedBackground(m == mode) }
    showState(
        when (mode) {
          Mode.FRAGMENT -> "fragment callback owns back (${fragmentCallbacks.size} found)"
          Mode.SYSTEM -> "system owns back"
          Mode.HOST -> "host callback owns back"
        },
    )
  }

  private fun onProgress(phase: String, progress: Float) {
    showState("$phase ${"%.2f".format(progress)}")
    if (phase == "started" || phase == "progress") {
      val scale = 1f - 0.08f * progress
      content.translationX = dp(48) * progress
      content.scaleX = scale
      content.scaleY = scale
    }
    emit(
        "HostBackProgress",
        Arguments.createMap().apply {
          putString("phase", phase)
          putDouble("progress", progress.toDouble())
        },
    )
  }

  private fun forwardCommitToFragment() {
    val fragment =
        supportFragmentManager.findFragmentById(R.id.rn_fragment_container) as? ReactNativeFragment
    if (fragment?.onBackPressed() != true) {
      finish()
      return
    }
    // JS answers asynchronously: if it releases the commit, invokeDefaultOnBackPressed finishes
    // this activity; if it keeps the screen, the content has to come back.
    resetContent()
  }

  private fun resetContent() {
    content.animate().translationX(0f).scaleX(1f).scaleY(1f).setDuration(180).start()
  }

  /**
   * The callback ReactNativeBrownfield.createView registers is private, so the only way for a
   * host to turn it off today is to find it on the dispatcher. Demo-only; a real fix belongs in
   * react-native-brownfield.
   */
  private fun fragmentCallbacks(): List<OnBackPressedCallback> {
    val dispatcher = onBackPressedDispatcher
    return OnBackPressedDispatcher::class
        .java
        .declaredFields
        .flatMap { field ->
          field.isAccessible = true
          (field.get(dispatcher) as? Iterable<*>)?.filterIsInstance<OnBackPressedCallback>()
              ?: emptyList()
        }
        .filter { it.javaClass.name.startsWith(BROWNFIELD_PACKAGE) }
  }

  private fun showState(text: String) {
    stateLabel.text = "gesture: $text"
  }

  private fun emit(event: String, payload: Any) {
    ReactNativeBrownfield.shared.reactHost.currentReactContext?.emitDeviceEvent(event, payload)
  }

  private fun buildContent(): View {
    val root =
        LinearLayout(this).apply {
          orientation = LinearLayout.VERTICAL
          setBackgroundColor(NativeUi.BACKGROUND)
          val pad = dp(16)
          setPadding(pad, dp(40), pad, 0)
        }

    root.addView(label("Native host", 22f))
    root.addView(
        label(
            "Screen 3 of 3. AppCompatActivity, not a ReactActivity. The host decides who " +
                "owns back:",
            13f,
            NativeUi.MUTED,
        ).apply { setPadding(0, dp(6), 0, dp(8)) },
    )

    val modes =
        LinearLayout(this).apply {
          orientation = LinearLayout.HORIZONTAL
          setPadding(0, 0, 0, dp(8))
        }
    Mode.entries.forEach { m ->
      val b =
          button(m.title, selected = m == mode) { setMode(m) }
              .apply {
                textSize = 12f
                layoutParams =
                    LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                        .apply { marginEnd = if (m == Mode.entries.last()) 0 else dp(6) }
              }
      modeButtons[m] = b
      modes.addView(b)
    }
    root.addView(modes)

    stateLabel = label("", 14f).apply { setPadding(0, 0, 0, dp(8)) }
    root.addView(stateLabel)

    content =
        FragmentContainerView(this).apply {
          id = R.id.rn_fragment_container
          layoutParams =
              LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
        }
    root.addView(content)

    return root
  }

  companion object {
    private const val TAG = "NativeHost"
    private const val BROWNFIELD_PACKAGE = "com.callstack.reactnativebrownfield."

    /** The second appKey registered in index.js. */
    const val EMBED = "RNEmbed"
  }
}
