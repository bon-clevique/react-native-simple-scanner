import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

type Double = number;

export interface BarcodeScannedEvent {
  type: string;
  data: string;
  boundsX?: Double;
  boundsY?: Double;
  boundsWidth?: Double;
  boundsHeight?: Double;
}

export interface ScannerErrorEvent {
  message: string;
  code?: string;
}

export interface CameraStatusChangeEvent {
  status: string;
}

interface NativeProps extends ViewProps {
  barcodeTypes?: ReadonlyArray<string>;
  flashEnabled?: boolean;
  isScanning?: boolean;
  onBarcodeScanned?: DirectEventHandler<BarcodeScannedEvent>;
  onScannerError?: DirectEventHandler<ScannerErrorEvent>;
  onCameraStatusChange?: DirectEventHandler<CameraStatusChangeEvent>;
}

export default codegenNativeComponent<NativeProps>('SimpleScannerView');
