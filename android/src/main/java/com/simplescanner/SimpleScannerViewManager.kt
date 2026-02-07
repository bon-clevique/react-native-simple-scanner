package com.simplescanner

import com.facebook.react.bridge.ReadableArray
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

  @ReactProp(name = "barcodeTypes")
  override fun setBarcodeTypes(view: SimpleScannerView?, types: ReadableArray?) {
    if (view != null && types != null) {
      val typeList = mutableListOf<String>()
      for (i in 0 until types.size()) {
        types.getString(i)?.let { typeList.add(it) }
      }
      view.setBarcodeTypes(typeList)
    }
  }

  @ReactProp(name = "flashEnabled")
  override fun setFlashEnabled(view: SimpleScannerView?, enabled: Boolean) {
    view?.setFlashEnabled(enabled)
  }

  @ReactProp(name = "isScanning")
  override fun setIsScanning(view: SimpleScannerView?, value: Boolean) {
    // TODO: implement isScanning toggle on Android
  }

  companion object {
    const val NAME = "SimpleScannerView"
  }
}
