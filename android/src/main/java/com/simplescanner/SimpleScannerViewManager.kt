package com.simplescanner

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.SimpleScannerViewManagerInterface
import com.facebook.react.viewmanagers.SimpleScannerViewManagerDelegate

@ReactModule(name = SimpleScannerViewManager.NAME)
class SimpleScannerViewManager : SimpleViewManager<SimpleScannerView>(),
  SimpleScannerViewManagerInterface<SimpleScannerView> {
  private val mDelegate: ViewManagerDelegate<SimpleScannerView>

  init {
    mDelegate = SimpleScannerViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<SimpleScannerView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): SimpleScannerView {
    return SimpleScannerView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: SimpleScannerView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "SimpleScannerView"
  }
}
