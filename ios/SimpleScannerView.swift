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
        print("SimpleScannerView: layoutSubviews called with bounds: \(bounds)")
        previewLayer?.frame = bounds
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        print("SimpleScannerView: didMoveToWindow called, window: \(window != nil ? "present" : "nil")")
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
        print("SimpleScannerView: setupScanner called")
        scanner = BarcodeScanner()
        scanner?.delegate = self

        guard let scanner = scanner else {
            print("SimpleScannerView: Failed to create scanner")
            return
        }

        do {
            try scanner.setupCaptureSession()
            print("SimpleScannerView: Capture session setup successful")

            if let previewLayer = scanner.previewLayer {
                self.previewLayer = previewLayer
                previewLayer.frame = bounds
                previewLayer.videoGravity = .resizeAspectFill
                previewLayer.backgroundColor = UIColor.black.cgColor
                layer.insertSublayer(previewLayer, at: 0)
                print("SimpleScannerView: Preview layer added with frame: \(bounds)")
            } else {
                print("SimpleScannerView: Preview layer is nil")
            }
        } catch {
            print("SimpleScannerView: Setup error: \(error)")
            emitError(error)
        }
    }

    // MARK: - Private Methods

    private func startScanning() {
        print("SimpleScannerView: startScanning called")
        scanner?.startScanning()
    }

    private func stopScanning() {
        print("SimpleScannerView: stopScanning called")
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
        onScannerError?([
            "message": error.localizedDescription
        ])
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

