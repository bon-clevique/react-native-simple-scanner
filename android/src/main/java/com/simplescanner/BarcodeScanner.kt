package com.simplescanner

import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

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
  private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private var barcodeScanner = createBarcodeScanner(listOf(Barcode.FORMAT_QR_CODE))

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
    if (!checkPermission()) {
      onError(BarcodeScannerError.PERMISSION_DENIED)
      return
    }

    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

    cameraProviderFuture.addListener({
      try {
        val provider = cameraProviderFuture.get()
        cameraProvider = provider

        val preview = Preview.Builder().build().also {
          it.setSurfaceProvider(previewView.surfaceProvider)
        }

        imageAnalysis = ImageAnalysis.Builder()
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .build()
          .also {
            it.setAnalyzer(cameraExecutor) { imageProxy ->
              processImage(imageProxy)
            }
          }

        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

        try {
          provider.unbindAll()
          camera = provider.bindToLifecycle(
            lifecycleOwner,
            cameraSelector,
            preview,
            imageAnalysis
          )

          updateFlash()
        } catch (e: Exception) {
          Log.e("BarcodeScanner", "Use case binding failed", e)
          onError(BarcodeScannerError.CONFIGURATION_FAILED)
        }
      } catch (e: Exception) {
        Log.e("BarcodeScanner", "Camera initialization failed", e)
        onError(BarcodeScannerError.CONFIGURATION_FAILED)
      }
    }, ContextCompat.getMainExecutor(context))
  }

  fun startScanning() {
    // CameraX handles lifecycle automatically, so this is mainly for consistency
    // The camera is already running when bound to lifecycle
  }

  fun stopScanning() {
    cameraProvider?.unbindAll()
    camera = null
  }

  fun setBarcodeTypes(types: List<String>) {
    val newTypes = types.mapNotNull { mapBarcodeType(it) }
    if (newTypes != supportedBarcodeTypes) {
      supportedBarcodeTypes = newTypes
      // Recreate scanner with new formats
      barcodeScanner.close()
      barcodeScanner = createBarcodeScanner(supportedBarcodeTypes)
    }
  }

  fun setFlashEnabled(enabled: Boolean) {
    flashEnabled = enabled
    updateFlash()
  }

  private fun updateFlash() {
    camera?.cameraControl?.enableTorch(flashEnabled)
  }

  private fun processImage(imageProxy: androidx.camera.core.ImageProxy) {
    val mediaImage = imageProxy.image
    if (mediaImage == null) {
      imageProxy.close()
      return
    }

    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

    barcodeScanner.process(image)
      .addOnSuccessListener { barcodes ->
        for (barcode in barcodes) {
          val type = mapBarcodeFormatToString(barcode.format)
          val rawValue = barcode.rawValue ?: continue

          val result = BarcodeScanResult(type = type, data = rawValue)

          // Emit on main thread
          android.os.Handler(android.os.Looper.getMainLooper()).post {
            delegate?.onBarcodeScanned(result)
          }

          // Only process first barcode
          break
        }
      }
      .addOnFailureListener { e ->
        Log.e("BarcodeScanner", "Barcode scanning failed", e)
        android.os.Handler(android.os.Looper.getMainLooper()).post {
          delegate?.onError(BarcodeScannerError.UNKNOWN)
        }
      }
      .addOnCompleteListener {
        imageProxy.close()
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
    stopScanning()
    cameraExecutor.shutdown()
    barcodeScanner.close()
  }
}

