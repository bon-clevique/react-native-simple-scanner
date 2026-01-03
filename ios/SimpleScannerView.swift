import UIKit
import AVFoundation

@objc(SimpleScannerViewSwift)
public class SimpleScannerViewSwift: UIView {
    // MARK: - Properties

    private var scanner: BarcodeScanner?
    private var previewLayer: AVCaptureVideoPreviewLayer?

    @objc var onBarcodeScanned: RCTDirectEventBlock?
    @objc var onScannerError: RCTDirectEventBlock?

    @objc var barcodeTypes: [String] = ["qr"] {
        didSet {
            updateBarcodeTypes()
        }
    }

    @objc var flashEnabled: Bool = false {
        didSet {
            updateFlash()
        }
    }

    // MARK: - Initialization

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupScanner()
    }

    required init?(coder: NSCoder) {
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
                layer.addSublayer(previewLayer)
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
    func barcodeScanner(_ scanner: BarcodeScanner, didScan result: BarcodeScanResult) {
        onBarcodeScanned?([
            "type": result.type,
            "data": result.data
        ])
    }

    func barcodeScanner(_ scanner: BarcodeScanner, didFailWithError error: Error) {
        emitError(error)
    }
}

