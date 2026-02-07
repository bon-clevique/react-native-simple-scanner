import AVFoundation
import UIKit

// MARK: - Types

public enum BarcodeScannerError: Error {
    case cameraUnavailable
    case invalidDeviceInput
    case unauthorized
    case configurationFailed

    var localizedDescription: String {
        switch self {
        case .cameraUnavailable:
            return "Camera is not available on this device"
        case .invalidDeviceInput:
            return "Failed to create camera input"
        case .unauthorized:
            return "Camera permission not granted"
        case .configurationFailed:
            return "Failed to configure camera session"
        }
    }
}

public struct BarcodeScanResult {
    let type: String
    let data: String
    let bounds: CGRect?
}

public enum CameraStatus: String {
    case initializing = "initializing"
    case ready = "ready"
    case error = "error"
    case permissionRequired = "permission-required"
}

public protocol BarcodeScannerDelegate: AnyObject {
    func barcodeScanner(_ scanner: BarcodeScanner, didScan result: BarcodeScanResult)
    func barcodeScanner(_ scanner: BarcodeScanner, didFailWithError error: Error)
    func barcodeScanner(_ scanner: BarcodeScanner, didChangeStatus status: CameraStatus)
}

// MARK: - BarcodeScanner

public class BarcodeScanner: NSObject {
    // MARK: - Properties

    public weak var delegate: BarcodeScannerDelegate?

    private let session = AVCaptureSession()
    private let metadataOutput = AVCaptureMetadataOutput()
    private let metadataQueue = DispatchQueue(label: "com.clevique.scanner.metadata")
    private var deviceInput: AVCaptureDeviceInput?
    private var device: AVCaptureDevice?

    public private(set) var previewLayer: AVCaptureVideoPreviewLayer?

    private var supportedBarcodeTypes: [AVMetadataObject.ObjectType] = [.qr]

    // MARK: - Initialization

    public override init() {
        super.init()
        setupPreviewLayer()
    }

    // MARK: - Public Methods

    public func setupCaptureSession(completion: @escaping (Error?) -> Void) {
        // Notify initializing status
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.delegate?.barcodeScanner(self, didChangeStatus: .initializing)
        }

        // Check camera availability
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.delegate?.barcodeScanner(self, didChangeStatus: .error)
            }
            completion(BarcodeScannerError.cameraUnavailable)
            return
        }

        self.device = device

        // Check authorization
        let status = AVCaptureDevice.authorizationStatus(for: .video)

        // Request permission if not determined
        if status == .notDetermined {
            // Request permission asynchronously
            AVCaptureDevice.requestAccess(for: .video) { [weak self] accessGranted in
                guard let self else { return }

                if !accessGranted {
                    DispatchQueue.main.async { [weak self] in
                        guard let self else { return }
                        self.delegate?.barcodeScanner(self, didChangeStatus: .permissionRequired)
                    }
                    completion(BarcodeScannerError.unauthorized)
                    return
                }

                // Permission granted, continue with session setup
                self.continueSetupCaptureSession(with: device, completion: completion)
            }
            return
        } else if status != .authorized {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.delegate?.barcodeScanner(self, didChangeStatus: .permissionRequired)
            }
            completion(BarcodeScannerError.unauthorized)
            return
        }

        // Permission already authorized, continue with session setup
        continueSetupCaptureSession(with: device, completion: completion)
    }

    private func continueSetupCaptureSession(with device: AVCaptureDevice, completion: @escaping (Error?) -> Void) {
        // Create input
        do {
            let input = try AVCaptureDeviceInput(device: device)
            deviceInput = input
        } catch {
            completion(BarcodeScannerError.invalidDeviceInput)
            return
        }

        // Configure session
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        // Remove existing inputs
        session.inputs.forEach { session.removeInput($0) }

        // Add input
        guard session.canAddInput(deviceInput!) else {
            completion(BarcodeScannerError.configurationFailed)
            return
        }
        session.addInput(deviceInput!)

        // Remove existing outputs
        session.outputs.forEach { session.removeOutput($0) }

        // Add output
        guard session.canAddOutput(metadataOutput) else {
            completion(BarcodeScannerError.configurationFailed)
            return
        }
        session.addOutput(metadataOutput)

        // Configure metadata output
        metadataOutput.setMetadataObjectsDelegate(self, queue: metadataQueue)
        updateMetadataObjectTypes()

        // Update preview layer
        previewLayer?.session = session

        // Notify ready status
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.delegate?.barcodeScanner(self, didChangeStatus: .ready)
        }

        // Session setup completed successfully
        completion(nil)
    }

    public func startScanning() {
        guard !session.isRunning else {
            return
        }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.session.startRunning()
        }
    }

    public func stopScanning() {
        guard session.isRunning else { return }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.session.stopRunning()
        }
    }

    public func setBarcodeTypes(_ types: [String]) {
        supportedBarcodeTypes = types.compactMap { mapBarcodeType($0) }
        updateMetadataObjectTypes()
    }

    public func setFlash(enabled: Bool) throws {
        guard let device = device, device.hasTorch else {
            return
        }

        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        if enabled {
            try device.setTorchModeOn(level: 1.0)
        } else {
            device.torchMode = .off
        }
    }

    // MARK: - Private Methods

    private func setupPreviewLayer() {
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        previewLayer = layer
    }

    private func updateMetadataObjectTypes() {
        let availableTypes = metadataOutput.availableMetadataObjectTypes
        let typesToSet = supportedBarcodeTypes.filter { availableTypes.contains($0) }
        metadataOutput.metadataObjectTypes = typesToSet
    }

    private func mapBarcodeType(_ type: String) -> AVMetadataObject.ObjectType? {
        switch type.lowercased() {
        case "qr":
            return .qr
        case "ean13":
            return .ean13
        case "ean8":
            return .ean8
        case "code128":
            return .code128
        case "upc-a":
            return .ean13  // UPC-A is detected as EAN-13 in iOS
        case "upc-e":
            return .upce
        case "code-39":
            return .code39
        default:
            return nil
        }
    }

    private func mapObjectTypeToString(_ type: AVMetadataObject.ObjectType) -> String {
        switch type {
        case .qr:
            return "qr"
        case .ean13:
            return "ean13"
        case .ean8:
            return "ean8"
        case .code128:
            return "code128"
        case .upce:
            return "upc-e"
        case .code39:
            return "code-39"
        default:
            return "unknown"
        }
    }
}

// MARK: - AVCaptureMetadataOutputObjectsDelegate

extension BarcodeScanner: AVCaptureMetadataOutputObjectsDelegate {
    public func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue else {
            return
        }

        let typeString = mapObjectTypeToString(metadataObject.type)

        // Convert normalized coordinates (0-1) to view coordinates (pixels)
        var bounds: CGRect? = nil
        if let previewLayer = previewLayer {
            // metadataObject.bounds is in normalized coordinates (0-1)
            let normalizedBounds = metadataObject.bounds
            // Convert to view coordinates
            bounds = previewLayer.layerRectConverted(fromMetadataOutputRect: normalizedBounds)
        }

        let result = BarcodeScanResult(type: typeString, data: stringValue, bounds: bounds)

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.delegate?.barcodeScanner(self, didScan: result)
        }
    }
}

