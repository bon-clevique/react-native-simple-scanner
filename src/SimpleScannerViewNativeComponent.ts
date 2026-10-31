import {
  codegenNativeComponent,
  type CodegenTypes,
  type HostComponent,
  type ViewProps,
} from 'react-native';

export interface BarcodeScannedEvent {
  type: string;
  data: string;
  boundsX?: CodegenTypes.Double;
  boundsY?: CodegenTypes.Double;
  boundsWidth?: CodegenTypes.Double;
  boundsHeight?: CodegenTypes.Double;
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
  onBarcodeScanned?: CodegenTypes.DirectEventHandler<BarcodeScannedEvent>;
  onScannerError?: CodegenTypes.DirectEventHandler<ScannerErrorEvent>;
  onCameraStatusChange?: CodegenTypes.DirectEventHandler<CameraStatusChangeEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'SimpleScannerView'
) as HostComponent<NativeProps>;
