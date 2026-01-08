import UIKit
import AVFoundation
import React

@objc(SimpleScannerViewSwift)
public class SimpleScannerViewSwift: UIView {
    // MARK: - Properties

    private var scanner: BarcodeScanner?
    private var previewLayer: AVCaptureVideoPreviewLayer?

    @objc public var onBarcodeScanned: RCTDirectEventBlock?
    @objc public var onScannerError: RCTDirectEventBlock?

    @objc public var barcodeTypes: [String] = ["qr"] {
        didSet {
            updateBarcodeTypes()
        }
    }

    @objc public var flashEnabled: Bool = false {
        didSet {
            updateFlash()
        }
    }

    // MARK: - Initialization

    @objc public override init(frame: CGRect) {
        super.init(frame: frame)
        setupScanner()
    }

    @objc public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupScanner()
    }

    // MARK: - Lifecycle

    public override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            startScanning()
        } else {
            stopScanning()
        }
    }

    deinit {
        cleanup()
    }

    // MARK: - Setup

    private func setupScanner() {
        scanner = BarcodeScanner()
        scanner?.delegate = self

        guard let scanner = scanner else {
            return
        }

        do {
            try scanner.setupCaptureSession()

            if let previewLayer = scanner.previewLayer {
                self.previewLayer = previewLayer
                previewLayer.frame = bounds
                previewLayer.videoGravity = .resizeAspectFill
                previewLayer.backgroundColor = UIColor.black.cgColor
                layer.insertSublayer(previewLayer, at: 0)
            }
        } catch {
            emitError(error)
        }
    }

    // MARK: - Private Methods

    private func startScanning() {
        scanner?.startScanning()
    }

    private func stopScanning() {
        scanner?.stopScanning()
    }

    private func updateBarcodeTypes() {
        scanner?.setBarcodeTypes(barcodeTypes)
    }

    private func updateFlash() {
        do {
            try scanner?.setFlash(enabled: flashEnabled)
        } catch {
            emitError(error)
        }
    }

    private func emitError(_ error: Error) {
        let errorCode = mapErrorToCode(error)
        onScannerError?([
            "message": error.localizedDescription,
            "code": errorCode
        ])
    }

    private func mapErrorToCode(_ error: Error) -> String {
        if let scannerError = error as? BarcodeScannerError {
            switch scannerError {
            case .cameraUnavailable:
                return "CAMERA_UNAVAILABLE"
            case .unauthorized:
                return "PERMISSION_DENIED"
            case .configurationFailed, .invalidDeviceInput:
                return "CONFIGURATION_FAILED"
            }
        }
        return "UNKNOWN"
    }

    private func cleanup() {
        stopScanning()
        previewLayer?.removeFromSuperlayer()
        previewLayer = nil
        scanner = nil
    }
}

// MARK: - BarcodeScannerDelegate

extension SimpleScannerViewSwift: BarcodeScannerDelegate {
    public func barcodeScanner(_ scanner: BarcodeScanner, didScan result: BarcodeScanResult) {
        onBarcodeScanned?([
            "type": result.type,
            "data": result.data
        ])
    }

    public func barcodeScanner(_ scanner: BarcodeScanner, didFailWithError error: Error) {
        emitError(error)
    }
}

