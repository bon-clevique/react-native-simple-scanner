# react-native-simple-scanner

[![npm version](https://img.shields.io/npm/v/react-native-simple-scanner.svg)](https://www.npmjs.com/package/react-native-simple-scanner)
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

### With Camera Permission Helpers

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  BarcodeScannerView,
  checkCameraPermission,
  requestCameraPermission,
  type PermissionStatus,
} from 'react-native-simple-scanner';

export default function App() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('not-determined');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const status = await checkCameraPermission();
      setPermissionStatus(status);
      setLoading(false);

      if (status === 'not-determined') {
        const granted = await requestCameraPermission();
        setPermissionStatus(granted ? 'granted' : 'denied');
      }
    };

    checkPermission();
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (permissionStatus !== 'granted') {
    return <Text>Camera permission required</Text>;
  }

  return (
    <BarcodeScannerView
      barcodeTypes={['qr']}
      onBarcodeScanned={(result) => console.log(result)}
      style={{ flex: 1 }}
    />
  );
}
```

### With Camera Status Change

```tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  BarcodeScannerView,
  type CameraStatus,
} from 'react-native-simple-scanner';

export default function App() {
  const [cameraStatus, setCameraStatus] =
    useState<CameraStatus>('initializing');

  return (
    <View style={{ flex: 1 }}>
      {cameraStatus === 'initializing' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator />
          <Text>Preparing camera...</Text>
        </View>
      )}

      {cameraStatus === 'permission-required' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Camera permission required</Text>
        </View>
      )}

      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={(result) => console.log(result)}
        onCameraStatusChange={setCameraStatus}
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

### With Scanning Pause/Resume

```tsx
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { BarcodeScannerView } from 'react-native-simple-scanner';

export default function App() {
  const [isScanning, setIsScanning] = useState(true);

  const handleBarcodeScanned = (result) => {
    setIsScanning(false); // Pause scanning

    Alert.alert('Scanned', result.data, [
      { text: 'Scan Again', onPress: () => setIsScanning(true) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={handleBarcodeScanned}
        isScanning={isScanning}
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

### With Bounding Box Overlay

```tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BarcodeScannerView,
  type BarcodeResult,
} from 'react-native-simple-scanner';

export default function App() {
  const [highlightBox, setHighlightBox] = useState<
    BarcodeResult['bounds'] | null
  >(null);

  const handleBarcodeScanned = (result: BarcodeResult) => {
    if (result.bounds) {
      setHighlightBox(result.bounds);

      // Clear highlight after animation
      setTimeout(() => setHighlightBox(null), 500);
    }

    console.log('Scanned:', result.data);
  };

  return (
    <View style={{ flex: 1 }}>
      <BarcodeScannerView
        barcodeTypes={['qr']}
        onBarcodeScanned={handleBarcodeScanned}
        style={{ flex: 1 }}
      />

      {highlightBox && (
        <View
          style={[
            styles.highlight,
            {
              left: highlightBox.x,
              top: highlightBox.y,
              width: highlightBox.width,
              height: highlightBox.height,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
  },
});
```

## API Reference

### `BarcodeScannerView`

Main component for scanning barcodes.

#### Props

| Prop                   | Type                              | Default      | Description                                                                  |
| ---------------------- | --------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `barcodeTypes`         | `BarcodeType[]`                   | `['qr']`     | Array of barcode types to detect                                             |
| `onBarcodeScanned`     | `(result: BarcodeResult) => void` | **Required** | Callback fired when a barcode is scanned                                     |
| `flashEnabled`         | `boolean`                         | `false`      | Enable/disable flashlight                                                    |
| `onError`              | `(error: ScannerError) => void`   | -            | Callback fired when an error occurs                                          |
| `scanInterval`         | `number`                          | `1000`       | Minimum interval between scanning the same barcode (ms). Set to 0 to disable |
| `onCameraReady`        | `() => void`                      | -            | Callback fired when camera is ready                                          |
| `onCameraStatusChange` | `(status: CameraStatus) => void`  | -            | Callback fired when camera status changes                                    |
| `isScanning`           | `boolean`                         | `true`       | Whether barcode detection is active                                          |
| `style`                | `ViewStyle`                       | -            | Component style                                                              |
| `testID`               | `string`                          | -            | Test ID for testing purposes                                                 |

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
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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

#### `PermissionStatus`

```typescript
type PermissionStatus = 'granted' | 'denied' | 'not-determined';
```

#### `CameraStatus`

```typescript
type CameraStatus = 'initializing' | 'ready' | 'error' | 'permission-required';
```

### Helper Functions

#### `checkCameraPermission()`

Check current camera permission status without prompting the user.

```typescript
import { checkCameraPermission } from 'react-native-simple-scanner';

const status = await checkCameraPermission();
// Returns: 'granted' | 'denied' | 'not-determined'
```

#### `requestCameraPermission()`

Request camera permission from the user.

```typescript
import { requestCameraPermission } from 'react-native-simple-scanner';

const granted = await requestCameraPermission();
// Returns: boolean (true if granted, false otherwise)
```

### Testing

Use the provided Jest mock module for testing:

```typescript
import { setupMocks, simulateScan, resetMocks } from 'react-native-simple-scanner/mocks';

// In jest.setup.js
setupMocks();

// In test file
describe('ScannerScreen', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('handles barcode scan', () => {
    render(<ScannerScreen />);

    simulateScan({
      type: 'ean13',
      data: '9784873117324',
      timestamp: Date.now(),
    });

    expect(screen.getByText('ISBN detected!')).toBeTruthy();
  });
});
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
