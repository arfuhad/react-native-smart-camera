# react-native-smart-camera

Expo-compatible native module for camera preview, face detection, blink detection, and WebRTC streaming.

## Overview

Build a production-ready Expo-compatible native module that provides:

- Camera preview via VisionCamera
- Real-time face and blink detection using Google ML Kit
- Static image face detection
- Native WebRTC bridge for video calling and streaming
- Expo config plugin for zero-config setup

## Expo Compatibility

| Expo Workflow | Supported | Why |
|---------------|-----------|-----|
| Expo Managed | ❌ No | WebRTC + VisionCamera need native code |
| Expo Dev Client | ✅ Yes | Allows custom native modules |
| Expo Bare | ✅ Yes | Full native control |

**Requirements:**
- Expo SDK ≥ 49
- Expo Dev Client
- EAS Build

## Architecture

```
Expo App
 ├── SmartCamera (JS Component)
 ├── VisionCamera (native)
 ├── Frame Processor (worklet)
 ├── Native WebRTC Bridge
 │     ├── iOS (Swift)
 │     └── Android (Kotlin)
 └── react-native-webrtc
```

## Installation

```bash
expo install react-native-smart-camera
expo prebuild
expo run:ios
expo run:android
```

Or with EAS:

```bash
eas build --profile development
```

## Usage

```tsx
import { SmartCamera } from 'react-native-smart-camera';

<SmartCamera
  camera="front"
  faceDetection={{
    enabled: true,
    performanceMode: 'fast',
    landmarkMode: 'all',
    classificationMode: 'all',
  }}
  blinkDetection
  onBlinkDetected={handleBlink}
  onFaceDetected={handleFaces}
  webrtc={{
    enabled: true,
    peerConnection,
    mode: 'call',
  }}
/>
```

---

## API Reference

### SmartCamera Component Props

```typescript
interface SmartCameraProps {
  // Camera settings
  camera?: 'front' | 'back';
  fps?: number;
  style?: ViewStyle;
  
  // Face Detection Options
  faceDetection?: FaceDetectionConfig;
  
  // Blink Detection
  blinkDetection?: boolean;
  onBlinkDetected?: (event: BlinkEvent) => void;
  
  // Face Detection Callback
  onFaceDetected?: (faces: Face[]) => void;
  
  // WebRTC Configuration
  webrtc?: WebRTCConfig;
}
```

---

## Face Detection Options

### Common Options (Frame Processor and Static Images)

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `performanceMode` | Favor speed or accuracy when detecting faces | `'fast'` | `'fast'`, `'accurate'` |
| `landmarkMode` | Whether to identify facial landmarks: eyes, ears, nose, cheeks, mouth | `'none'` | `'none'`, `'all'` |
| `contourMode` | Whether to detect contours of facial features. Contours are detected for only the most prominent face in an image | `'none'` | `'none'`, `'all'` |
| `classificationMode` | Whether to classify faces into categories such as 'smiling' and 'eyes open' | `'none'` | `'none'`, `'all'` |
| `minFaceSize` | Sets the smallest desired face size, expressed as the ratio of the width of the head to width of the image | `0.15` | `number` |
| `trackingEnabled` | Whether to assign faces an ID to track faces across images. Note: When contour detection is enabled, only one face is detected, so face tracking doesn't produce useful results. Don't enable both contour detection and face tracking | `false` | `boolean` |

### Frame Processor Options

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `cameraFacing` | Current active camera | `'front'` | `'front'`, `'back'` |
| `autoMode` | Should handle auto scale (face bounds, contour and landmarks) and rotation on native side? If disabled, all detection results will be relative to frame coordinates, not to screen/preview. You shouldn't use this option if you want to draw on screen using Skia Frame Processor | `false` | `boolean` |
| `windowWidth` | Required if you want to use `autoMode`. You must handle your own logic to get screen sizes, with or without statusbar size, etc. | `1.0` | `number` |
| `windowHeight` | Required if you want to use `autoMode`. You must handle your own logic to get screen sizes, with or without statusbar size, etc. | `1.0` | `number` |

### Static Images Options

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `image` | Image source for static face detection | - | `number`, `string`, `{ uri: string }` |

---

## Types

```typescript
// Face Detection Options
interface FaceDetectionOptions {
  performanceMode?: 'fast' | 'accurate';
  landmarkMode?: 'none' | 'all';
  contourMode?: 'none' | 'all';
  classificationMode?: 'none' | 'all';
  minFaceSize?: number;
  trackingEnabled?: boolean;
}

// Frame Processor Options
interface FrameProcessorOptions extends FaceDetectionOptions {
  cameraFacing?: 'front' | 'back';
  autoMode?: boolean;
  windowWidth?: number;
  windowHeight?: number;
}

// Static Image Options
interface StaticImageOptions extends FaceDetectionOptions {
  image: number | string | { uri: string };
}

// Face Detection Result
interface Face {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: FaceLandmarks;
  contours?: FaceContours;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  trackingId?: number;
}

// Blink Event
interface BlinkEvent {
  timestamp: number;
  leftEyeOpen: number;  // 0.0 - 1.0
  rightEyeOpen: number; // 0.0 - 1.0
  isBlink: boolean;
  faceId?: number;
}

// WebRTC Configuration
interface WebRTCConfig {
  enabled: boolean;
  peerConnection?: RTCPeerConnection;
  mode?: 'call' | 'stream';
  videoConstraints?: {
    width?: number;
    height?: number;
    frameRate?: number;
  };
}
```

---

## Frame Processor Functions

```typescript
import { detectFaces, detectBlink } from 'react-native-smart-camera';

// Detect faces in a frame
const faces = detectFaces(frame, {
  performanceMode: 'fast',
  landmarkMode: 'all',
});

// Detect blink in a frame
const blinkEvent = detectBlink(frame, {
  classificationMode: 'all',
});
```

---

## Static Image Detection

```typescript
import { detectFacesInImage } from 'react-native-smart-camera';

const faces = await detectFacesInImage({
  image: require('./photo.jpg'),
  performanceMode: 'accurate',
  landmarkMode: 'all',
  contourMode: 'all',
});
```

---

## WebRTC Hooks

```typescript
import { useSmartCameraWebRTC } from 'react-native-smart-camera';

const { videoTrack, startStreaming, stopStreaming, switchCamera } = useSmartCameraWebRTC({
  enabled: true,
  peerConnection,
  mode: 'call',
});
```

---

## Expo Config Plugin

Add to your `app.json`:

```json
{
  "plugins": ["react-native-smart-camera"]
}
```

The plugin automatically:
- Adds camera permissions
- Adds microphone permissions
- Adds required iOS frameworks
- Configures Android Proguard rules

---

## Project Structure

```
react-native-smart-camera/
├── src/
│   ├── index.ts
│   ├── SmartCamera.tsx
│   ├── types.ts
│   ├── hooks/
│   │   ├── useSmartCamera.ts
│   │   ├── useBlinkDetection.ts
│   │   ├── useFaceDetection.ts
│   │   └── useSmartCameraWebRTC.ts
│   ├── detection/
│   │   ├── blinkProcessor.ts
│   │   ├── faceDetector.ts
│   │   └── staticImageDetector.ts
│   └── webrtc/
│       ├── WebRTCBridge.ts
│       └── types.ts
├── android/
│   ├── src/main/java/expo/modules/smartcamera/
│   │   ├── SmartCameraModule.kt
│   │   ├── SmartCameraView.kt
│   │   ├── MLKitBridge.kt
│   │   └── WebRTCFrameBridge.kt
│   └── build.gradle
├── ios/
│   ├── SmartCameraModule.swift
│   ├── SmartCameraView.swift
│   ├── MLKitBridge.swift
│   ├── WebRTCFrameBridge.swift
│   └── SmartCamera.podspec
├── plugin/
│   ├── index.ts
│   ├── withSmartCameraIOS.ts
│   └── withSmartCameraAndroid.ts
├── example/
│   ├── App.tsx
│   ├── app.json
│   └── package.json
├── app.plugin.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Limitations

- ❌ Not supported in Expo Go
- ❌ Requires Dev Client or Bare Workflow
- ❌ Native build required (via EAS or local)

---

## Peer Dependencies

```json
{
  "peerDependencies": {
    "react-native-vision-camera": ">=3.0.0",
    "react-native-webrtc": ">=118.0.0",
    "react-native-worklets-core": ">=1.0.0"
  }
}
```

---

## License

MIT

