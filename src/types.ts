/**
 * Supported barcode formats
 */
export type BarcodeType = 'qr' | 'ean13' | 'ean8' | 'code128';

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
