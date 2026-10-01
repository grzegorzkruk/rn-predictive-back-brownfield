package com.pbb.nativeapp

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.widget.Button
import android.widget.TextView

/** Plain-view helpers so the native screens need no layout XML. */
internal object NativeUi {
  const val BACKGROUND = 0xFF0B1020.toInt()
  const val SURFACE = 0xFF132043.toInt()
  const val BORDER = 0xFF24365F.toInt()
  const val ACCENT = 0xFF4C8DFF.toInt()
  const val MUTED = 0xFF93A2C6.toInt()

  fun Context.dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  fun Context.label(text: String, sizeSp: Float, color: Int = Color.WHITE): TextView =
      TextView(this).apply {
        this.text = text
        setTextColor(color)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
      }

  fun Context.button(text: String, selected: Boolean = true, onClick: () -> Unit): Button =
      Button(this).apply {
        this.text = text
        isAllCaps = false
        setTextColor(Color.WHITE)
        stateListAnimator = null
        background = roundedBackground(selected)
        setOnClickListener { onClick() }
      }

  fun Context.roundedBackground(selected: Boolean): GradientDrawable =
      GradientDrawable().apply {
        cornerRadius = dp(12).toFloat()
        setColor(if (selected) ACCENT else SURFACE)
        setStroke(dp(1), if (selected) ACCENT else BORDER)
      }
}
