import React, { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import SimpleScannerViewNativeComponent, {
  type BarcodeScannedEvent,
  type ScannerErrorEvent,
} from './SimpleScannerViewNativeComponent';
import type { BarcodeType, BarcodeResult } from './types';

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
  onError?: (error: Error) => void;

  /**
   * Component style
   */
  style?: ViewStyle;

  /**
   * Test ID for testing purposes
   */
  testID?: string;
}

export const BarcodeScannerView: React.FC<BarcodeScannerViewProps> = ({
  barcodeTypes = ['qr'],
  onBarcodeScanned,
  flashEnabled = false,
  onError,
  style,
  testID,
}) => {
  const handleBarcodeScanned = useCallback(
    (event: { nativeEvent: BarcodeScannedEvent }) => {
      const { type, data } = event.nativeEvent;
      onBarcodeScanned({
        type: type as BarcodeType,
        data,
        timestamp: Date.now(),
      });
    },
    [onBarcodeScanned]
  );

  const handleError = useCallback(
    (event: { nativeEvent: ScannerErrorEvent }) => {
      if (onError) {
        onError(new Error(event.nativeEvent.message));
      }
    },
    [onError]
  );

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
