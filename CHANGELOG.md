# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2024-12-24

### Added
- **WebRTC Video Calling** - Full-featured WebRTC integration for peer-to-peer video calls
  - `useWebRTC` hook for managing video calls with local/remote streams
  - `useWebRTCWithDetection` hook combining WebRTC + face detection + eye tracking
  - `WebRTCManager` class for low-level WebRTC control
  - Signaling helpers: `createOffer`, `createAnswer`, `setRemoteDescription`, `addIceCandidate`
  - Media controls: `switchCamera`, `toggleAudio`, `toggleVideo`
  - Call state tracking: `idle`, `connecting`, `connected`, `disconnected`
  
- **WebRTC Types**
  - `ICEServer`, `PeerConnectionConfig` for connection configuration
  - `MediaConstraints`, `VideoConstraints`, `AudioConstraints`
  - `CallState`, `WebRTCConnectionState`, `ICEConnectionState`
  - `SessionDescription`, `ICECandidateEvent` for signaling
  - Default configurations: `DEFAULT_ICE_SERVERS`, `DEFAULT_PEER_CONNECTION_CONFIG`

- **Eye Status API** - Updated `useBlinkDetection` hook
  - Returns real-time `eyeStatus` with `leftEye` and `rightEye` open probability
  - User-configurable `eyeClosedThreshold` (default 0.5)
  - `processEyeStatus(faces)` function to process detected faces
  - `onEyeStatusChange` callback for status updates

### Changed
- **Breaking**: `useBlinkDetection` now returns `eyeStatus` instead of `blinkCount`
  - Old: `{ lastBlink, blinkCount, resetCount }`
  - New: `{ eyeStatus, processEyeStatus, reset }`
  - Users implement their own blink counting logic using `onEyeStatusChange`

- Updated README with comprehensive WebRTC and eye tracking documentation
- Example app now includes tabbed interface with Face Detection and Video Call screens
- Example app integrates with Socket.io signaling server for real video calls

### Deprecated
- `useSmartCameraWebRTC` - Use `useWebRTC` instead
- `WebRTCBridge` - Use `WebRTCManager` instead

## [0.1.4] - 2024-12-24

### Added
- `useFaceDetector` hook matching `react-native-vision-camera-face-detector` API
- `useFaceDetectorWithCallback` convenience hook
- All ML Kit contour types support (LEFT_EYEBROW_TOP, LEFT_EYEBROW_BOTTOM, etc.)
- `autoMode` option for automatic coordinate scaling

### Changed
- Restructured package as pure React Native module (removed Expo module dependency)
- Updated native plugin registration for standard React Native autolinking
- Moved podspec to package root as `react-native-smart-camera.podspec`

### Fixed
- Fixed duplicate module registration issues
- Fixed frame processor plugin registration on Android and iOS

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

[Unreleased]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/arfuhad/react-native-smart-camera/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/arfuhad/react-native-smart-camera/releases/tag/v0.1.0
