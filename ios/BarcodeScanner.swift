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
}

public protocol BarcodeScannerDelegate: AnyObject {
    func barcodeScanner(_ scanner: BarcodeScanner, didScan result: BarcodeScanResult)
    func barcodeScanner(_ scanner: BarcodeScanner, didFailWithError error: Error)
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

    public func setupCaptureSession() throws {
        // Check camera availability
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw BarcodeScannerError.cameraUnavailable
        }

        self.device = device

        // Check authorization
        let status = AVCaptureDevice.authorizationStatus(for: .video)

        // Request permission if not determined
        if status == .notDetermined {
            // Request permission synchronously using semaphore
            // Note: This must be called before setting up the capture session
            let semaphore = DispatchSemaphore(value: 0)
            var granted = false

            AVCaptureDevice.requestAccess(for: .video) { accessGranted in
                granted = accessGranted
                semaphore.signal()
            }

            // Wait for permission request to complete (max 10 seconds timeout)
            let timeout = semaphore.wait(timeout: .now() + 10)

            if timeout == .timedOut {
                throw BarcodeScannerError.unauthorized
            }

            if !granted {
                throw BarcodeScannerError.unauthorized
            }
        } else if status != .authorized {
            throw BarcodeScannerError.unauthorized
        }

        // Create input
        do {
            let input = try AVCaptureDeviceInput(device: device)
            deviceInput = input
        } catch {
            throw BarcodeScannerError.invalidDeviceInput
        }

        // Configure session
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        // Remove existing inputs
        session.inputs.forEach { session.removeInput($0) }

        // Add input
        guard session.canAddInput(deviceInput!) else {
            throw BarcodeScannerError.configurationFailed
        }
        session.addInput(deviceInput!)

        // Remove existing outputs
        session.outputs.forEach { session.removeOutput($0) }

        // Add output
        guard session.canAddOutput(metadataOutput) else {
            throw BarcodeScannerError.configurationFailed
        }
        session.addOutput(metadataOutput)

        // Configure metadata output
        metadataOutput.setMetadataObjectsDelegate(self, queue: metadataQueue)
        updateMetadataObjectTypes()

        // Update preview layer
        previewLayer?.session = session
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
        let result = BarcodeScanResult(type: typeString, data: stringValue)

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.delegate?.barcodeScanner(self, didScan: result)
        }
    }
}

