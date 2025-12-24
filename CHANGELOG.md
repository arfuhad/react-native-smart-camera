# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2024-12-24

### Added
- **Real-time face detection frame processor plugin** for VisionCamera
  - Android: `FaceDetectorFrameProcessorPlugin` using ML Kit
  - iOS: `FaceDetectorFrameProcessorPlugin` using ML Kit
- `isFaceDetectorAvailable()` function to check if the plugin is ready

### Changed
- Updated `detectFaces` to use VisionCamera's `VisionCameraProxy.initFrameProcessorPlugin` API
- Added VisionCamera and ML Kit dependencies to iOS podspec
- Added VisionCamera frame processor support to Android build.gradle

### Fixed
- Fixed "Property '__detectFaces' doesn't exist" error by implementing proper frame processor plugin

## [0.1.2] - 2024-12-24

### Fixed
- Fixed compatibility with `react-native-vision-camera` v4 (`OutputOrientation` type change)
- Fixed compatibility with `react-native-worklets-core` v1.3+ (`useRunOnJS` hook instead of `runOnJS`)
- Fixed `expo-modules-core` EventEmitter usage for newer versions
- Fixed TypeScript config to use `expo-module-scripts/tsconfig.base` instead of deprecated `tsconfig.module`
- Fixed Expo config plugin to use `withDangerousMod` instead of deprecated `withPodfile`

### Changed
- Updated example app to Expo SDK 51 and React Native 0.74
- Updated example app imports to use scoped package name `@arfuhad/react-native-smart-camera`

## [0.1.1] - 2024-12-24

### Fixed
- Added missing CameraX dependencies for Android (`androidx.camera:camera-core`, `camera-camera2`, `camera-lifecycle`, `camera-view`)

## [0.1.0] - 2024-12-24

### Added
- Initial release
- Camera preview via VisionCamera integration
- Real-time face detection with Google ML Kit
- Blink detection with configurable sensitivity
- Native WebRTC bridge for video calling and streaming
- Expo config plugin for zero-config setup
- Static image face detection
- TypeScript support with full type definitions

### Features
- `SmartCamera` component with face/blink detection
- `useSmartCamera` hook for camera permissions and device management
- `useFaceDetection` hook for face detection state
- `useBlinkDetection` hook for blink counting with debouncing
- `useSmartCameraWebRTC` hook for WebRTC streaming
- `detectFacesInImage` function for static image analysis
- iOS and Android native modules

### Supported Platforms
- iOS (requires Expo Dev Client or Bare Workflow)
- Android (requires Expo Dev Client or Bare Workflow)

[Unreleased]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/arfuhad/react-native-smart-camera/releases/tag/v0.1.0


