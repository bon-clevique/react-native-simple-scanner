// Disable React Native's default setup to avoid ESM issues
// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
    },
  };
});

// Skip React Native's setup.js which uses ESM
jest.mock('react-native/jest/setup', () => {}, { virtual: true });
