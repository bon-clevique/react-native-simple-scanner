# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-01-XX

### Added

- `scanInterval` prop to prevent duplicate scans within a specified interval (default: 1000ms)
- `onCameraReady` callback prop to notify when camera is ready
- `ScannerError` class with error codes for better error handling
- Error code mapping from iOS native errors to TypeScript `ScannerErrorCode` enum
- Component memoization with `React.memo` for performance optimization

### Changed

- `onError` callback now receives `ScannerError` instead of generic `Error`
- Improved error handling with structured error codes
- Optimized `useCallback` dependencies to prevent unnecessary re-renders
- Enhanced TypeScript type safety for error handling

### Fixed

- Duplicate barcode scans are now prevented by default (1 second interval)
- Error events now include error codes for better error categorization

### Technical Details

- Component is now memoized to prevent unnecessary re-renders
- Scan interval control uses refs to avoid state updates for better performance
- Error codes are mapped from iOS `BarcodeScannerError` to `ScannerErrorCode`

## [0.1.0] - 2026-01-08

### Added

- Initial iOS implementation
- QR Code support
- EAN-13 support
- EAN-8 support
- CODE-128 support
- Flash control
- TypeScript types
- React Native Fabric View support
- Error handling
- Example app

### Technical Details

- iOS 14+ support
- React Native 0.72+ support
- TypeScript strict mode
- Bundle size <2MB
