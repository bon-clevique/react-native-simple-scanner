package com.simplescanner

import android.content.Context
import android.util.AttributeSet
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.camera.view.PreviewView
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.findViewTreeLifecycleOwner
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

class SimpleScannerView(context: Context) : FrameLayout(context), LifecycleEventListener {
  private val reactContext = context as ThemedReactContext
  private val previewView = PreviewView(context).apply {
    layoutParams = LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
  }
  private var barcodeScanner: BarcodeScanner? = null
  private var barcodeTypes: List<String> = listOf("qr")
  private var flashEnabled = false
  private var scanning = true
  private var listening = false
  private var dropped = false
  private var hostActive = false

  init { addView(previewView) }

  @Suppress("UNUSED_PARAMETER")
  constructor(context: Context?, attrs: AttributeSet?) : this(context ?: throw IllegalArgumentException("Context cannot be null"))

  @Suppress("UNUSED_PARAMETER")
  constructor(context: Context?, attrs: AttributeSet?, defStyleAttr: Int) : this(context ?: throw IllegalArgumentException("Context cannot be null"))

  private fun startCamera() {
    if (dropped || !isAttachedToWindow || !hostActive) return
    val existing = barcodeScanner
    if (existing != null) {
      existing.startScanning()
      return
    }
    val owner = findViewTreeLifecycleOwner() ?: reactContext.currentActivity as? LifecycleOwner
    if (owner == null) {
      sendScannerErrorEvent(BarcodeScannerError.CONFIGURATION_FAILED)
      return // onHostResume retries when an Activity becomes available.
    }
    val scanner = BarcodeScanner(context, owner)
    barcodeScanner = scanner
    scanner.setDelegate(object : BarcodeScannerDelegate {
      override fun onBarcodeScanned(result: BarcodeScanResult) {
        dispatch("onBarcodeScanned", Arguments.createMap().apply {
          putString("type", result.type)
          putString("data", result.data)
        })
      }

      override fun onError(error: BarcodeScannerError) { sendScannerErrorEvent(error) }

      override fun onCameraStatusChange(status: String) {
        dispatch("onCameraStatusChange", Arguments.createMap().apply { putString("status", status) })
      }
    })
    scanner.setBarcodeTypes(barcodeTypes)
    scanner.setFlashEnabled(flashEnabled)
    scanner.setIsScanning(scanning)
    scanner.setupCamera(previewView) { sendScannerErrorEvent(it) }
  }

  private fun dispatch(name: String, data: WritableMap) {
    if (dropped || !isAttachedToWindow || id == NO_ID) return
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)?.dispatchEvent(
      ScannerEvent(UIManagerHelper.getSurfaceId(reactContext), id, name, data)
    )
  }

  private fun sendScannerErrorEvent(error: BarcodeScannerError) {
    dispatch("onScannerError", Arguments.createMap().apply {
      putString("code", error.name)
      putString("message", error.message)
    })
  }

  fun setBarcodeTypes(types: List<String>) {
    barcodeTypes = types
    barcodeScanner?.setBarcodeTypes(types)
  }

  fun setFlashEnabled(enabled: Boolean) {
    flashEnabled = enabled
    barcodeScanner?.setFlashEnabled(enabled)
  }

  fun setIsScanning(enabled: Boolean) {
    scanning = enabled
    barcodeScanner?.setIsScanning(enabled)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    hostActive = reactContext.lifecycleState == LifecycleState.RESUMED
    if (!dropped && !listening) {
      reactContext.addLifecycleEventListener(this)
      listening = true
    }
    // Wait until React has applied the view's tag, props and event emitters.
    post { startCamera() }
  }

  override fun onDetachedFromWindow() {
    releaseScanner()
    removeLifecycleListener()
    super.onDetachedFromWindow()
  }

  override fun onHostResume() {
    hostActive = true
    post { startCamera() }
  }
  override fun onHostPause() {
    hostActive = false
    barcodeScanner?.stopScanning()
  }
  override fun onHostDestroy() {
    hostActive = false
    releaseScanner()
  }

  private fun releaseScanner() {
    barcodeScanner?.cleanup()
    barcodeScanner = null
  }

  private fun removeLifecycleListener() {
    if (listening) reactContext.removeLifecycleEventListener(this)
    listening = false
  }

  fun cleanup() {
    dropped = true
    releaseScanner()
    removeLifecycleListener()
  }
}

private class ScannerEvent(
  surfaceId: Int,
  viewTag: Int,
  private val name: String,
  private val data: WritableMap
) : Event<ScannerEvent>(surfaceId, viewTag) {
  override fun getEventName() = name
  override fun getEventData() = data
  override fun canCoalesce() = false
}
