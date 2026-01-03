# react-native-simple-scanner

A lightweight and simple barcode/QR code scanner for React Native with Fabric View support.

## Features

- 🚀 **Lightweight**: Bundle size <2MB
- 📱 **iOS Support**: iOS 14+ (Android coming in Phase 2)
- 🔧 **Simple API**: Easy to use, minimal setup
- 🎯 **TypeScript**: Full TypeScript support with strict mode
- ⚡ **Fabric View**: React Native new architecture support
- 📸 **Multiple Formats**: QR Code, EAN-13, EAN-8, CODE-128

## Installation

```bash
pnpm add react-native-simple-scanner
# or
npm install react-native-simple-scanner
# or
yarn add react-native-simple-scanner
```

### iOS Setup

1. Install pods:

```bash
cd ios && pod install && cd ..
```

2. Add camera permission to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan barcodes</string>
```

## Usage

### Basic Example

```tsx
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import {
  BarcodeScannerView,
  type BarcodeResult,
} from 'react-native-simple-scanner';

export default function App() {
  const handleBarcodeScanned = (result: BarcodeResult) => {
    Alert.alert(
      'Barcode Scanned',
      `Type: ${result.type}\nData: ${result.data}`
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <BarcodeScannerView
        barcodeTypes={['qr', 'ean13']}
        onBarcodeScanned={handleBarcodeScanned}
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

### With Flash Control

```tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { BarcodeScannerView } from 'react-native-simple-scanner';

export default function App() {
  const [flashOn, setFlashOn] = useState(false);

  return (
    <>
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={(result) => console.log(result)}
        flashEnabled={flashOn}
        style={{ flex: 1 }}
      />
      <TouchableOpacity onPress={() => setFlashOn(!flashOn)}>
        <Text>Toggle Flash</Text>
      </TouchableOpacity>
    </>
  );
}
```

### Error Handling

```tsx
import { Linking, Alert } from 'react-native';
import { BarcodeScannerView } from 'react-native-simple-scanner';

<BarcodeScannerView
  barcodeTypes={['qr']}
  onBarcodeScanned={(result) => console.log(result)}
  onError={(error) => {
    if (error.message.includes('permission')) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert('Error', error.message);
    }
  }}
/>
```

## API Reference

### `BarcodeScannerView`

Main component for scanning barcodes.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `barcodeTypes` | `BarcodeType[]` | `['qr']` | Array of barcode types to detect |
| `onBarcodeScanned` | `(result: BarcodeResult) => void` | **Required** | Callback fired when a barcode is scanned |
| `flashEnabled` | `boolean` | `false` | Enable/disable flashlight |
| `onError` | `(error: Error) => void` | - | Callback fired when an error occurs |
| `style` | `ViewStyle` | - | Component style |

### Types

#### `BarcodeType`

```typescript
type BarcodeType = 'qr' | 'ean13' | 'ean8' | 'code128';
```

#### `BarcodeResult`

```typescript
interface BarcodeResult {
  type: BarcodeType;
  data: string;
  timestamp: number;
}
```

## Supported Barcode Types

- **QR Code** (`qr`): QR codes
- **EAN-13** (`ean13`): European Article Number (13 digits)
- **EAN-8** (`ean8`): European Article Number (8 digits)
- **CODE-128** (`code128`): Code 128 barcodes

## Requirements

- React Native >= 0.72.0
- iOS >= 14.0
- TypeScript >= 4.8 (recommended)

## Troubleshooting

### Camera Permission Issues

Make sure you have added `NSCameraUsageDescription` to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan barcodes</string>
```

### Camera Not Starting

- Ensure you're testing on a real device (simulator doesn't support camera)
- Check that camera permissions are granted in Settings
- Verify that `Info.plist` contains the camera usage description

### Build Errors

If you encounter build errors:

1. Clean build folders:
```bash
pnpm clean
```

2. Reinstall pods:
```bash
cd ios && pod install && cd ..
```

3. Rebuild the project

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

## Roadmap

- [ ] Android support (Phase 2)
- [ ] Additional barcode formats
- [ ] Custom overlay UI options
- [ ] Zoom control
