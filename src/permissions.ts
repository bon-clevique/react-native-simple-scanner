import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { PermissionStatus } from './types';

function getPermissionModule() {
  const { PermissionModule } = NativeModules;
  if (!PermissionModule) {
    throw new Error(
      'PermissionModule is not available. Make sure react-native-simple-scanner is properly linked.'
    );
  }
  return PermissionModule;
}

/**
 * Check current camera permission status without prompting the user
 * @returns Promise resolving to the current permission status
 */
export function checkCameraPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA).then(
      (granted) => (granted ? 'granted' : 'denied')
    );
  }
  return getPermissionModule().checkCameraPermission();
}

/**
 * Request camera permission from the user
 * @returns Promise resolving to true if permission was granted, false otherwise
 */
export function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    ).then((result) => result === PermissionsAndroid.RESULTS.GRANTED);
  }
  return getPermissionModule().requestCameraPermission();
}
