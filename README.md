# react-native-simple-scanner

[![npm version](https://badge.fury.io/js/react-native-simple-scanner.svg)](https://www.npmjs.com/package/react-native-simple-scanner)
[![npm downloads](https://img.shields.io/npm/dm/react-native-simple-scanner.svg)](https://www.npmjs.com/package/react-native-simple-scanner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/bon-clevique/react-native-simple-scanner/blob/master/CONTRIBUTING.md)

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
import {
  BarcodeScannerView,
  ScannerError,
  ScannerErrorCode,
} from 'react-native-simple-scanner';

<BarcodeScannerView
  barcodeTypes={['qr']}
  onBarcodeScanned={(result) => console.log(result)}
  onError={(error: ScannerError) => {
    if (error.code === ScannerErrorCode.PERMISSION_DENIED) {
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
/>;
```

### With Scan Interval Control

```tsx
import { BarcodeScannerView } from 'react-native-simple-scanner';

<BarcodeScannerView
  barcodeTypes={['qr']}
  onBarcodeScanned={(result) => console.log(result)}
  scanInterval={2000} // Prevent duplicate scans for 2 seconds
  style={{ flex: 1 }}
/>;
```

### With Camera Ready Callback

```tsx
import { BarcodeScannerView } from 'react-native-simple-scanner';

<BarcodeScannerView
  barcodeTypes={['qr']}
  onBarcodeScanned={(result) => console.log(result)}
  onCameraReady={() => {
    console.log('Camera is ready!');
  }}
  style={{ flex: 1 }}
/>;
```

## API Reference

### `BarcodeScannerView`

Main component for scanning barcodes.

#### Props

| Prop               | Type                              | Default      | Description                                                                  |
| ------------------ | --------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `barcodeTypes`     | `BarcodeType[]`                   | `['qr']`     | Array of barcode types to detect                                             |
| `onBarcodeScanned` | `(result: BarcodeResult) => void` | **Required** | Callback fired when a barcode is scanned                                     |
| `flashEnabled`     | `boolean`                         | `false`      | Enable/disable flashlight                                                    |
| `onError`          | `(error: ScannerError) => void`   | -            | Callback fired when an error occurs                                          |
| `scanInterval`     | `number`                          | `1000`       | Minimum interval between scanning the same barcode (ms). Set to 0 to disable |
| `onCameraReady`    | `() => void`                      | -            | Callback fired when camera is ready                                          |
| `style`            | `ViewStyle`                       | -            | Component style                                                              |
| `testID`           | `string`                          | -            | Test ID for testing purposes                                                 |

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

#### `ScannerError`

```typescript
class ScannerError extends Error {
  code: ScannerErrorCode;
  message: string;
}
```

#### `ScannerErrorCode`

```typescript
enum ScannerErrorCode {
  CAMERA_UNAVAILABLE = 'CAMERA_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CONFIGURATION_FAILED = 'CONFIGURATION_FAILED',
  UNKNOWN = 'UNKNOWN',
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

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://clevique.app/"><img src="https://avatars.githubusercontent.com/u/251686758?v=4?s=100" width="100px;" alt="Clevique.app"/><br /><sub><b>Clevique.app</b></sub></a><br /><a href="https://github.com/Clevique/react-native-simple-scanner/commits?author=Clevique" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

MIT

## Roadmap

- [ ] Android support (Phase 2)
- [ ] Additional barcode formats
- [ ] Custom overlay UI options
- [ ] Zoom control
