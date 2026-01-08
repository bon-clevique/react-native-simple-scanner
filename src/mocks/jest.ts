import type { BarcodeResult, ScannerError, CameraStatus } from '../types';
import type { BarcodeScannerViewProps } from '../BarcodeScannerView';

export const mockBarcodeScannerView = jest.fn<null, [BarcodeScannerViewProps]>(
  () => null
);

export const mockCheckCameraPermission = jest
  .fn()
  .mockResolvedValue('granted' as const);

export const mockRequestCameraPermission = jest.fn().mockResolvedValue(true);

/**
 * Helper to simulate barcode scan in tests
 */
export const simulateScan = (result: BarcodeResult) => {
  const lastCall = mockBarcodeScannerView.mock.calls.slice(-1)[0];
  const props = lastCall?.[0];
  if (props && 'onBarcodeScanned' in props && props.onBarcodeScanned) {
    props.onBarcodeScanned(result);
  }
};

/**
 * Helper to simulate error in tests
 */
export const simulateError = (error: ScannerError) => {
  const lastCall = mockBarcodeScannerView.mock.calls.slice(-1)[0];
  const props = lastCall?.[0];
  if (props && 'onError' in props && props.onError) {
    props.onError(error);
  }
};

/**
 * Helper to simulate camera status change in tests
 */
export const simulateCameraStatusChange = (status: CameraStatus) => {
  const lastCall = mockBarcodeScannerView.mock.calls.slice(-1)[0];
  const props = lastCall?.[0];
  if (props && 'onCameraStatusChange' in props && props.onCameraStatusChange) {
    props.onCameraStatusChange(status);
  }
};

/**
 * Setup Jest mocks for react-native-simple-scanner
 */
export const setupMocks = () => {
  jest.mock('react-native-simple-scanner', () => ({
    BarcodeScannerView: mockBarcodeScannerView,
    checkCameraPermission: mockCheckCameraPermission,
    requestCameraPermission: mockRequestCameraPermission,
    ScannerErrorCode: {
      CAMERA_UNAVAILABLE: 'CAMERA_UNAVAILABLE',
      PERMISSION_DENIED: 'PERMISSION_DENIED',
      CONFIGURATION_FAILED: 'CONFIGURATION_FAILED',
      UNKNOWN: 'UNKNOWN',
    },
  }));
};

/**
 * Reset all mocks to their initial state
 */
export const resetMocks = () => {
  mockBarcodeScannerView.mockClear();
  mockCheckCameraPermission.mockClear();
  mockRequestCameraPermission.mockClear();
};
