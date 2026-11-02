package com.simplescanner

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCase
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.Observer
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

// MARK: - Types

enum class BarcodeScannerError(val message: String) {
  CAMERA_UNAVAILABLE("Camera is not available on this device"),
  PERMISSION_DENIED("Camera permission not granted"),
  CONFIGURATION_FAILED("Failed to configure camera session"),
  UNKNOWN("Unknown error occurred")
}

data class BarcodeScanResult(
  val type: String,
  val data: String
)

interface BarcodeScannerDelegate {
  fun onBarcodeScanned(result: BarcodeScanResult)
  fun onError(error: BarcodeScannerError)
  fun onCameraStatusChange(status: String) {}
}

// MARK: - BarcodeScanner

class BarcodeScanner(
  private val context: Context,
  private val lifecycleOwner: LifecycleOwner
) {
  private var delegate: BarcodeScannerDelegate? = null
  private var camera: Camera? = null
  private var cameraProvider: ProcessCameraProvider? = null
  private var imageAnalysis: ImageAnalysis? = null
  private var preview: Preview? = null
  private var previewView: PreviewView? = null
  private var cameraObserver: Observer<CameraState>? = null
  private var onCameraError: ((BarcodeScannerError) -> Unit)? = null
  private val mainExecutor = ContextCompat.getMainExecutor(context)
  private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private val state = ScannerState(createBarcodeScanner(listOf(Barcode.FORMAT_QR_CODE)))
  private var closed = false

  private var supportedBarcodeTypes: List<Int> = listOf(Barcode.FORMAT_QR_CODE)
  private var flashEnabled: Boolean = false

  private fun createBarcodeScanner(formats: List<Int>): com.google.mlkit.vision.barcode.BarcodeScanner {
    val options = if (formats.size > 1) {
      BarcodeScannerOptions.Builder()
        .setBarcodeFormats(formats.first(), *formats.drop(1).toIntArray())
        .build()
    } else {
      BarcodeScannerOptions.Builder()
        .setBarcodeFormats(formats.firstOrNull() ?: Barcode.FORMAT_QR_CODE)
        .build()
    }
    return BarcodeScanning.getClient(options)
  }

  fun setDelegate(delegate: BarcodeScannerDelegate?) {
    this.delegate = delegate
  }

  fun checkPermission(): Boolean {
    return ContextCompat.checkSelfPermission(
      context,
      android.Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun setupCamera(previewView: PreviewView, onError: (BarcodeScannerError) -> Unit) {
    this.previewView = previewView
    onCameraError = onError
    startScanning()
  }

  fun startScanning() {
    if (closed) return
    val target = previewView ?: return
    if (!checkPermission()) {
      delegate?.onCameraStatusChange("permission-required")
      onCameraError?.invoke(BarcodeScannerError.PERMISSION_DENIED)
      return
    }
    val generation = state.start() ?: return
    delegate?.onCameraStatusChange("initializing")
    try {
      val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
      cameraProviderFuture.addListener({
        if (!state.isCameraCurrent(generation)) return@addListener
        try {
          val provider = cameraProviderFuture.get()
          cameraProvider = provider
          val selector = CameraSelector.DEFAULT_BACK_CAMERA
          if (!provider.hasCamera(selector)) {
            stopScanning()
            reportCameraError(BarcodeScannerError.CAMERA_UNAVAILABLE)
            return@addListener
          }
          val cameraPreview = Preview.Builder().build().also {
            it.setSurfaceProvider(target.surfaceProvider)
          }
          preview = cameraPreview
          val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also {
              it.setAnalyzer(cameraExecutor) { imageProxy ->
                processImage(imageProxy, generation)
              }
            }
          imageAnalysis = analysis
          val boundCamera = provider.bindToLifecycle(lifecycleOwner, selector, cameraPreview, analysis)
          camera = boundCamera
          cameraObserver = Observer<CameraState> { cameraState ->
            if (state.isCameraCurrent(generation)) {
              if (cameraState.error != null) {
                reportCameraError(BarcodeScannerError.CAMERA_UNAVAILABLE)
              } else if (cameraState.type == CameraState.Type.OPEN) {
                delegate?.onCameraStatusChange("ready")
              }
            }
          }
          boundCamera.cameraInfo.cameraState.observe(lifecycleOwner, cameraObserver!!)
          updateFlash()
        } catch (e: Exception) {
          Log.e("BarcodeScanner", "Camera initialization failed", e)
          stopScanning()
          reportCameraError(BarcodeScannerError.CONFIGURATION_FAILED)
        }
      }, mainExecutor)
    } catch (e: Exception) {
      stopScanning()
      reportCameraError(BarcodeScannerError.CONFIGURATION_FAILED)
    }
  }

  private fun reportCameraError(error: BarcodeScannerError) {
    delegate?.onCameraStatusChange("error")
    onCameraError?.invoke(error)
  }

  fun stopScanning() {
    state.stop()
    imageAnalysis?.clearAnalyzer()
    cameraObserver?.let { camera?.cameraInfo?.cameraState?.removeObserver(it) }
    cameraObserver = null
    val useCases = listOfNotNull<UseCase>(preview, imageAnalysis)
    if (useCases.isNotEmpty()) cameraProvider?.unbind(*useCases.toTypedArray())
    preview = null
    imageAnalysis = null
    camera = null
  }

  fun setIsScanning(enabled: Boolean) {
    state.setScanning(enabled)
  }

  fun setBarcodeTypes(types: List<String>) {
    if (closed) return
    val newTypes = types.mapNotNull { mapBarcodeType(it) }.distinct()
    if (newTypes != supportedBarcodeTypes) {
      val decoder = if (newTypes.isEmpty()) null else createBarcodeScanner(newTypes)
      state.replaceDecoder(decoder)
      supportedBarcodeTypes = newTypes
    }
  }

  fun setFlashEnabled(enabled: Boolean) {
    flashEnabled = enabled
    updateFlash()
  }

  private fun updateFlash() {
    val target = camera ?: return
    if (target.cameraInfo.hasFlashUnit()) target.cameraControl.enableTorch(flashEnabled)
  }

  @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
  private fun processImage(imageProxy: ImageProxy, generation: Long) {
    val lease = state.acquire(generation)
    if (lease == null) {
      imageProxy.close()
      return
    }
    val completed = AtomicBoolean(false)
    fun finish() {
      if (completed.compareAndSet(false, true)) {
        try { imageProxy.close() } finally { lease.close() }
      }
    }
    try {
      val mediaImage = imageProxy.image
      if (mediaImage == null) {
        finish()
        return
      }
      val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
      lease.decoder.process(image)
        .addOnSuccessListener(mainExecutor) { barcodes ->
          if (state.canDeliver(lease)) {
            barcodes.firstOrNull { it.rawValue != null }?.let {
              delegate?.onBarcodeScanned(BarcodeScanResult(mapBarcodeFormatToString(it.format), it.rawValue!!))
            }
          }
        }
        .addOnFailureListener(mainExecutor) { e ->
          Log.e("BarcodeScanner", "Barcode scanning failed", e)
          if (state.canDeliver(lease)) delegate?.onError(BarcodeScannerError.UNKNOWN)
        }
        .addOnCompleteListener(mainExecutor) { finish() }
    } catch (e: Exception) {
      Log.e("BarcodeScanner", "Could not process camera frame", e)
      mainExecutor.execute {
        try {
          if (state.canDeliver(lease)) delegate?.onError(BarcodeScannerError.UNKNOWN)
        } finally { finish() }
      }
    }
  }

  private fun mapBarcodeType(type: String): Int? {
    return when (type.lowercase()) {
      "qr" -> Barcode.FORMAT_QR_CODE
      "ean13" -> Barcode.FORMAT_EAN_13
      "ean8" -> Barcode.FORMAT_EAN_8
      "code128" -> Barcode.FORMAT_CODE_128
      "upc-a" -> Barcode.FORMAT_UPC_A
      "upc-e" -> Barcode.FORMAT_UPC_E
      "code-39" -> Barcode.FORMAT_CODE_39
      else -> null
    }
  }

  private fun mapBarcodeFormatToString(format: Int): String {
    return when (format) {
      Barcode.FORMAT_QR_CODE -> "qr"
      Barcode.FORMAT_EAN_13 -> "ean13"
      Barcode.FORMAT_EAN_8 -> "ean8"
      Barcode.FORMAT_CODE_128 -> "code128"
      Barcode.FORMAT_UPC_A -> "upc-a"
      Barcode.FORMAT_UPC_E -> "upc-e"
      Barcode.FORMAT_CODE_39 -> "code-39"
      else -> "unknown"
    }
  }

  fun cleanup() {
    if (closed) return
    closed = true
    stopScanning()
    delegate = null
    onCameraError = null
    previewView = null
    cameraExecutor.shutdown()
    state.close()
  }
}
