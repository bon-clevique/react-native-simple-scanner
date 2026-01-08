// Mock React Native modules
global.___TEST___ = true;

// Skip React Native's setup.js which uses ESM
jest.mock('react-native/jest/setup', () => {}, { virtual: true });
