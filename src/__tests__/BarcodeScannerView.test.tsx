import { render, fireEvent } from '@testing-library/react-native';
import { BarcodeScannerView } from '../BarcodeScannerView';

jest.mock('../SimpleScannerViewNativeComponent', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: jest.fn((props) => <View {...props} testID="native-scanner" />),
  };
});

describe('BarcodeScannerView', () => {
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

  it('handles errors gracefully', () => {
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
      nativeEvent: { message: 'Test error' },
    });

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      })
    );
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
});
