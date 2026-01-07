package com.simplescanner

import android.content.Context
import android.util.AttributeSet
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.camera.view.PreviewView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class SimpleScannerView(context: Context) : FrameLayout(context) {
  private var previewView: PreviewView? = null
  private var barcodeScanner: BarcodeScanner? = null
  private var barcodeTypes: List<String> = listOf("qr")
  private var flashEnabled: Boolean = false
  private val reactContext: ThemedReactContext = context as ThemedReactContext

  constructor(context: Context?, attrs: AttributeSet?) : this(context ?: throw IllegalArgumentException("Context cannot be null"))

  constructor(context: Context?, attrs: AttributeSet?, defStyleAttr: Int) : this(context ?: throw IllegalArgumentException("Context cannot be null"))

  init {
    setupView()
  }

  private fun setupView() {
    previewView = PreviewView(context).apply {
      layoutParams = LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    }
    addView(previewView)

    val activity = reactContext.currentActivity

    if (activity != null && previewView != null) {
      barcodeScanner = BarcodeScanner(context, activity).apply {
        setDelegate(object : BarcodeScannerDelegate {
          override fun onBarcodeScanned(result: BarcodeScanResult) {
            sendBarcodeScannedEvent(result.type, result.data)
          }

          override fun onError(error: BarcodeScannerError) {
            sendScannerErrorEvent(error.message)
          }
        })

        setupCamera(previewView!!) { error ->
          sendScannerErrorEvent(error.message)
        }
      }
    } else {
      sendScannerErrorEvent("Activity not available")
    }
  }

  private fun sendBarcodeScannedEvent(type: String, data: String) {
    val event = Arguments.createMap().apply {
      putString("type", type)
      putString("data", data)
    }
    reactContext.getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, "onBarcodeScanned", event)
  }

  private fun sendScannerErrorEvent(message: String) {
    val event = Arguments.createMap().apply {
      putString("message", message)
    }
    reactContext.getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, "onScannerError", event)
  }

  fun setBarcodeTypes(types: List<String>) {
    barcodeTypes = types
    barcodeScanner?.setBarcodeTypes(types)
  }

  fun setFlashEnabled(enabled: Boolean) {
    flashEnabled = enabled
    barcodeScanner?.setFlashEnabled(enabled)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    barcodeScanner?.startScanning()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    barcodeScanner?.stopScanning()
  }

  fun cleanup() {
    barcodeScanner?.cleanup()
    barcodeScanner = null
    previewView = null
  }
}
