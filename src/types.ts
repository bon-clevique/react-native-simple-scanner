/**
 * Supported barcode formats
 */
export type BarcodeType =
  | 'qr'
  | 'ean13'
  | 'ean8'
  | 'code128'
  | 'upc-a'
  | 'upc-e'
  | 'code-39';

/**
 * Camera permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'not-determined';

/**
 * Camera initialization status
 */
export type CameraStatus =
  | 'initializing'
  | 'ready'
  | 'error'
  | 'permission-required';

/**
 * Result returned when a barcode is scanned
 */
export interface BarcodeResult {
  /**
   * Type of barcode detected
   */
  type: BarcodeType;

  /**
   * Decoded string data
   */
  data: string;

  /**
   * Unix timestamp (milliseconds) when the barcode was scanned
   */
  timestamp: number;

  /**
   * Bounding box of the detected barcode in view coordinates
   * Values are in pixels relative to the BarcodeScannerView dimensions
   */
  bounds?: {
    /**
     * Left edge in pixels
     */
    x: number;
    /**
     * Top edge in pixels
     */
    y: number;
    /**
     * Width in pixels
     */
    width: number;
    /**
     * Height in pixels
     */
    height: number;
  };
}

/**
 * Error types that can occur during scanning
 */
export enum ScannerErrorCode {
  CAMERA_UNAVAILABLE = 'CAMERA_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CONFIGURATION_FAILED = 'CONFIGURATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Scanner error with additional context
 */
export class ScannerError extends Error {
  constructor(
    public code: ScannerErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ScannerError';
  }
}
