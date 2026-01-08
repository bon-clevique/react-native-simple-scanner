import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import SimpleScannerViewNativeComponent, {
  type BarcodeScannedEvent,
  type ScannerErrorEvent,
} from './SimpleScannerViewNativeComponent';
import type { BarcodeType, BarcodeResult } from './types';
import { ScannerError, ScannerErrorCode } from './types';

export interface BarcodeScannerViewProps {
  /**
   * Array of barcode types to detect
   * @default ['qr']
   */
  barcodeTypes?: BarcodeType[];

  /**
   * Callback fired when a barcode is scanned
   */
  onBarcodeScanned: (result: BarcodeResult) => void;

  /**
   * Enable/disable flashlight
   * @default false
   */
  flashEnabled?: boolean;

  /**
   * Callback fired when an error occurs
   */
  onError?: (error: ScannerError) => void;

  /**
   * Minimum interval between scanning the same barcode (in milliseconds)
   * Set to 0 to disable interval control
   * @default 1000
   */
  scanInterval?: number;

  /**
   * Callback fired when camera is ready
   */
  onCameraReady?: () => void;

  /**
   * Component style
   */
  style?: ViewStyle;

  /**
   * Test ID for testing purposes
   */
  testID?: string;
}

const BarcodeScannerViewComponent: React.FC<BarcodeScannerViewProps> = ({
  barcodeTypes = ['qr'],
  onBarcodeScanned,
  flashEnabled = false,
  onError,
  scanInterval = 1000,
  onCameraReady,
  style,
  testID,
}) => {
  const lastScannedDataRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleBarcodeScanned = useCallback(
    (event: { nativeEvent: BarcodeScannedEvent }) => {
      const { type, data } = event.nativeEvent;
      const now = Date.now();

      // Scan interval control
      if (scanInterval > 0) {
        const dataKey = `${type}:${data}`;
        if (
          lastScannedDataRef.current === dataKey &&
          now - lastScannedTimeRef.current < scanInterval
        ) {
          return; // Skip duplicate scan
        }
        lastScannedDataRef.current = dataKey;
        lastScannedTimeRef.current = now;
      }

      onBarcodeScanned({
        type: type as BarcodeType,
        data,
        timestamp: now,
      });
    },
    [onBarcodeScanned, scanInterval]
  );

  const handleError = useCallback(
    (event: { nativeEvent: ScannerErrorEvent }) => {
      if (onError) {
        const errorCode =
          (event.nativeEvent.code as ScannerErrorCode) ||
          ScannerErrorCode.UNKNOWN;
        onError(new ScannerError(errorCode, event.nativeEvent.message));
      }
    },
    [onError]
  );

  // Notify when camera is ready (simplified implementation)
  useEffect(() => {
    if (!isCameraReady && onCameraReady) {
      // Camera readiness is assumed after a short delay
      // In a real implementation, this would be triggered by a native event
      const timer = setTimeout(() => {
        setIsCameraReady(true);
        onCameraReady();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isCameraReady, onCameraReady]);

  return (
    <SimpleScannerViewNativeComponent
      barcodeTypes={barcodeTypes}
      flashEnabled={flashEnabled}
      onBarcodeScanned={handleBarcodeScanned}
      onScannerError={handleError}
      style={style}
      testID={testID}
    />
  );
};

export const BarcodeScannerView = React.memo(BarcodeScannerViewComponent);
