import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  BarcodeScannerView,
  checkCameraPermission,
  requestCameraPermission,
  type BarcodeResult,
} from 'react-native-simple-scanner';

export default function App() {
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(
    Platform.OS !== 'android'
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    const check = async (prompt: boolean) => {
      try {
        const status = await checkCameraPermission();
        const granted =
          status === 'granted' || (prompt && (await requestCameraPermission()));
        if (active) setPermissionGranted(granted);
      } catch (error) {
        if (active) Alert.alert('Camera permission', String(error));
      }
    };
    void check(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check(false);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const handleBarcodeScanned = (scannedResult: BarcodeResult) => {
    setResult(scannedResult);
    Alert.alert(
      'Barcode Scanned',
      `Type: ${scannedResult.type.toUpperCase()}\nData: ${scannedResult.data}`,
      [{ text: 'OK' }]
    );
  };

  const handleError = (error: Error) => {
    if (
      error.message.includes('permission') ||
      error.message.includes('unauthorized')
    ) {
      Alert.alert(
        'カメラ権限が必要です',
        '設定アプリからカメラへのアクセスを許可してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openSettings() },
        ]
      );
    } else if (error.message.includes('unavailable')) {
      Alert.alert(
        'カメラが利用できません',
        'このデバイスではカメラが利用できません'
      );
    } else {
      Alert.alert('エラー', error.message);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {permissionGranted ? (
          <BarcodeScannerView
            barcodeTypes={['qr', 'ean13', 'ean8', 'code128']}
            onBarcodeScanned={handleBarcodeScanned}
            flashEnabled={flashOn}
            onError={handleError}
            style={styles.scanner}
          />
        ) : (
          <View style={styles.permissionPrompt}>
            <Text style={styles.flashText}>
              カメラへのアクセスを許可してください
            </Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.flashText}>設定を開く</Text>
            </TouchableOpacity>
          </View>
        )}

        {permissionGranted && (
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.flashButton}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Text style={styles.flashText}>
                {flashOn ? '🔦 ON' : '🔦 OFF'}
              </Text>
            </TouchableOpacity>

            {result && (
              <View style={styles.resultBox}>
                <Text style={styles.resultType}>
                  {result.type.toUpperCase()}
                </Text>
                <Text style={styles.resultData}>{result.data}</Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
  },
  permissionPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  flashButton: {
    alignSelf: 'flex-end',
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  flashText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultBox: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
  },
  resultType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultData: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
});
