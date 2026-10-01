package com.pbb.nativeapp

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import com.pbb.nativeapp.NativeUi.button
import com.pbb.nativeapp.NativeUi.dp
import com.pbb.nativeapp.NativeUi.label

/**
 * Screen 1: a native screen with nothing from React Native mounted.
 *
 * It registers no back callback, so a swipe here is the system's back-to-home animation. That
 * is the baseline the other two screens are compared against.
 */
class LauncherActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val root =
        LinearLayout(this).apply {
          orientation = LinearLayout.VERTICAL
          setBackgroundColor(NativeUi.BACKGROUND)
          val pad = dp(20)
          setPadding(pad, dp(48), pad, pad)
        }

    root.addView(label("Native screen", 26f))
    root.addView(
        label(
            "Screen 1 of 3. A plain AppCompatActivity: no React Native view, no back " +
                "callback. Swiping back here plays the system back-to-home animation.",
            14f,
            NativeUi.MUTED,
        ).apply { setPadding(0, dp(8), 0, dp(24)) },
    )
    root.addView(
        button("Open React Native screen") {
          startActivity(Intent(this, RNActivity::class.java))
        },
    )
    root.addView(
        button("Open React Native screen (back not set up)", selected = false) {
          startActivity(
              Intent(this, RNActivity::class.java)
                  .putExtra(RNActivity.EXTRA_INITIAL_OWNERSHIP, "unset"),
          )
        }.apply {
          layoutParams =
              LinearLayout.LayoutParams(
                      LinearLayout.LayoutParams.MATCH_PARENT,
                      LinearLayout.LayoutParams.WRAP_CONTENT,
                  )
                  .apply { topMargin = dp(12) }
        },
    )

    setContentView(root)
  }
}
