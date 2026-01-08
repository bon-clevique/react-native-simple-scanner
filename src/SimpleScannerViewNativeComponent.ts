import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

export interface BarcodeScannedEvent {
  type: string;
  data: string;
}

export interface ScannerErrorEvent {
  message: string;
  code?: string;
}

interface NativeProps extends ViewProps {
  barcodeTypes?: ReadonlyArray<string>;
  flashEnabled?: boolean;
  onBarcodeScanned?: DirectEventHandler<BarcodeScannedEvent>;
  onScannerError?: DirectEventHandler<ScannerErrorEvent>;
}

export default codegenNativeComponent<NativeProps>('SimpleScannerView');
