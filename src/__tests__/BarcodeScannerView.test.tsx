import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { type ViewProps } from 'react-native';
import { BarcodeScannerView } from '../BarcodeScannerView';
import { ScannerError, ScannerErrorCode } from '../types';

jest.mock('../SimpleScannerViewNativeComponent', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View: RNView } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(
      (props: ViewProps & { testID?: string }, ref: unknown) => {
        return React.createElement(RNView, {
          ...props,
          ref,
          testID: 'native-scanner',
        });
      }
    ),
  };
});

// Mock timers
jest.useFakeTimers();

describe('BarcodeScannerView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('renders correctly with required props', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={mockCallback}
        testID="scanner"
      />
    );

    expect(getByTestId('scanner')).toBeTruthy();
  });

  it('uses default barcodeTypes when not specified', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView onBarcodeScanned={mockCallback} testID="scanner" />
    );

    expect(getByTestId('scanner')).toBeTruthy();
  });

  it('calls onBarcodeScanned with correct data', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={mockCallback}
        testID="scanner"
      />
    );

    const nativeComponent = getByTestId('native-scanner');
    fireEvent(nativeComponent, 'onBarcodeScanned', {
      nativeEvent: { type: 'qr', data: 'test123' },
    });

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'qr',
        data: 'test123',
        timestamp: expect.any(Number),
      })
    );
  });

  it('handles errors gracefully with ScannerError', () => {
    const mockErrorHandler = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={jest.fn()}
        onError={mockErrorHandler}
        testID="scanner"
      />
    );

    const nativeComponent = getByTestId('native-scanner');
    fireEvent(nativeComponent, 'onScannerError', {
      nativeEvent: {
        message: 'Test error',
        code: 'PERMISSION_DENIED',
      },
    });

    expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(ScannerError));
    const error = mockErrorHandler.mock.calls[0][0];
    expect(error.code).toBe(ScannerErrorCode.PERMISSION_DENIED);
    expect(error.message).toBe('Test error');
  });

  it('handles errors without code as UNKNOWN', () => {
    const mockErrorHandler = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={jest.fn()}
        onError={mockErrorHandler}
        testID="scanner"
      />
    );

    const nativeComponent = getByTestId('native-scanner');
    fireEvent(nativeComponent, 'onScannerError', {
      nativeEvent: {
        message: 'Test error',
      },
    });

    expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(ScannerError));
    const error = mockErrorHandler.mock.calls[0][0];
    expect(error.code).toBe(ScannerErrorCode.UNKNOWN);
  });

  it('passes flashEnabled prop correctly', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={mockCallback}
        flashEnabled={true}
        testID="scanner"
      />
    );

    expect(getByTestId('scanner')).toBeTruthy();
  });

  it('handles multiple barcode types', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <BarcodeScannerView
        barcodeTypes={['qr', 'ean13', 'ean8', 'code128']}
        onBarcodeScanned={mockCallback}
        testID="scanner"
      />
    );

    expect(getByTestId('scanner')).toBeTruthy();
  });

  describe('scanInterval', () => {
    it('prevents duplicate scans within interval', () => {
      const mockCallback = jest.fn();
      const { getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          scanInterval={1000}
          testID="scanner"
        />
      );

      const nativeComponent = getByTestId('native-scanner');

      // First scan
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second scan immediately (should be blocked)
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('allows duplicate scans after interval', () => {
      const mockCallback = jest.fn();
      const { getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          scanInterval={1000}
          testID="scanner"
        />
      );

      const nativeComponent = getByTestId('native-scanner');

      // First scan
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance time by 1001ms
      jest.advanceTimersByTime(1001);

      // Second scan after interval (should be allowed)
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('allows different barcode data immediately', () => {
      const mockCallback = jest.fn();
      const { getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          scanInterval={1000}
          testID="scanner"
        />
      );

      const nativeComponent = getByTestId('native-scanner');

      // First scan
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Different data immediately (should be allowed)
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test456' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('disables interval control when set to 0', () => {
      const mockCallback = jest.fn();
      const { getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          scanInterval={0}
          testID="scanner"
        />
      );

      const nativeComponent = getByTestId('native-scanner');

      // First scan
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second scan immediately (should be allowed when interval is 0)
      fireEvent(nativeComponent, 'onBarcodeScanned', {
        nativeEvent: { type: 'qr', data: 'test123' },
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('onCameraReady', () => {
    it('calls onCameraReady callback', async () => {
      const mockCameraReady = jest.fn();
      render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={jest.fn()}
          onCameraReady={mockCameraReady}
          testID="scanner"
        />
      );

      // Advance timers to trigger camera ready callback
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockCameraReady).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onCameraReady when not provided', () => {
      const { getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={jest.fn()}
          testID="scanner"
        />
      );

      expect(getByTestId('scanner')).toBeTruthy();
      // Should not throw error
    });
  });

  describe('memoization', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const mockCallback = jest.fn();
      const { rerender, getByTestId } = render(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          testID="scanner"
        />
      );

      const firstRender = getByTestId('scanner');

      // Re-render with same props
      rerender(
        <BarcodeScannerView
          barcodeTypes={['qr']}
          onBarcodeScanned={mockCallback}
          testID="scanner"
        />
      );

      const secondRender = getByTestId('scanner');
      // Component should be memoized (same instance)
      expect(firstRender).toBe(secondRender);
    });
  });
});
