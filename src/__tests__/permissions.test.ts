const mockCheck = jest.fn();
const mockRequest = jest.fn();
const mockNativeModules: Record<string, unknown> = {};
let mockPlatformOS = 'android';

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
  NativeModules: mockNativeModules,
  PermissionsAndroid: {
    PERMISSIONS: { CAMERA: 'android.permission.CAMERA' },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    check: mockCheck,
    request: mockRequest,
  },
}));
jest.mock('../SimpleScannerViewNativeComponent', () => ({
  __esModule: true,
  default: () => null,
}));

function loadPermissions(): typeof import('../permissions') {
  let result: typeof import('../permissions');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    result = require('../permissions');
  });
  return result!;
}

beforeEach(() => {
  mockPlatformOS = 'android';
  mockCheck.mockReset();
  mockRequest.mockReset();
  for (const key of Object.keys(mockNativeModules))
    delete mockNativeModules[key];
});

it('imports the public Android entry without an iOS PermissionModule', () => {
  expect(() =>
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(require('../index').BarcodeScannerView).toBeDefined();
    })
  ).not.toThrow();
});

it.each([
  [true, 'granted'],
  [false, 'denied'],
])(
  'checks Android permission without prompting (%s)',
  async (granted, expected) => {
    mockCheck.mockResolvedValue(granted);
    await expect(loadPermissions().checkCameraPermission()).resolves.toBe(
      expected
    );
    expect(mockCheck).toHaveBeenCalledWith('android.permission.CAMERA');
    expect(mockRequest).not.toHaveBeenCalled();
  }
);

it.each([
  ['granted', true],
  ['denied', false],
  ['never_ask_again', false],
])('requests Android permission (%s)', async (status, expected) => {
  mockRequest.mockResolvedValue(status);
  await expect(loadPermissions().requestCameraPermission()).resolves.toBe(
    expected
  );
  expect(mockRequest).toHaveBeenCalledWith('android.permission.CAMERA');
});

it('preserves Android permission request failures', async () => {
  const error = new Error('Activity not available');
  mockRequest.mockRejectedValue(error);
  await expect(loadPermissions().requestCameraPermission()).rejects.toBe(error);
});

it('keeps the iOS native permission API and its not-determined status', async () => {
  mockPlatformOS = 'ios';
  const check = jest.fn().mockResolvedValue('not-determined');
  const request = jest.fn().mockResolvedValue(true);
  mockNativeModules.PermissionModule = {
    checkCameraPermission: check,
    requestCameraPermission: request,
  };
  const permissions = loadPermissions();
  await expect(permissions.checkCameraPermission()).resolves.toBe(
    'not-determined'
  );
  await expect(permissions.requestCameraPermission()).resolves.toBe(true);
  expect(check).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(1);
  expect(mockCheck).not.toHaveBeenCalled();
  expect(mockRequest).not.toHaveBeenCalled();
});

it('reports an unavailable iOS native permission module when called', () => {
  mockPlatformOS = 'ios';
  const permissions = loadPermissions();
  expect(() => permissions.checkCameraPermission()).toThrow(
    'PermissionModule is not available'
  );
});
