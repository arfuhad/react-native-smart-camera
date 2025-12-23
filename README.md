# react-native-smart-camera

An Expo-compatible native module that provides camera preview via VisionCamera, comprehensive face detection using Google ML Kit, blink detection, and a native WebRTC bridge for video calling and streaming.

## Requirements

- Expo SDK ≥ 49
- Expo Dev Client (required)
- EAS Build

> **Important**: This package does NOT work with Expo Go. You must use Expo Dev Client or Bare Workflow.

| Expo Workflow | Supported | Why |
|---------------|-----------|-----|
| Expo Managed (Go) | ❌ No | WebRTC + VisionCamera need native code |
| Expo Dev Client | ✅ Yes | Allows custom native modules |
| Expo Bare | ✅ Yes | Full native control |

## Installation

```bash
expo install react-native-smart-camera
expo prebuild
expo run:ios
# or
expo run:android
```

Or with EAS Build:

```bash
eas build --profile development
```

## Usage

### Basic Camera Preview

```tsx
import { SmartCamera } from 'react-native-smart-camera';

function App() {
  return (
    <SmartCamera
      camera="front"
      style={{ flex: 1 }}
    />
  );
}
```

### Face Detection with Blink Detection

```tsx
import { SmartCamera } from 'react-native-smart-camera';

function App() {
  const handleBlink = (event) => {
    console.log('Blink detected!', event);
  };

  const handleFaceDetected = (faces) => {
    console.log('Faces:', faces);
  };

  return (
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
      onFaceDetected={handleFaceDetected}
      style={{ flex: 1 }}
    />
  );
}
```

### WebRTC Video Calling

```tsx
import { SmartCamera } from 'react-native-smart-camera';
import { RTCPeerConnection } from 'react-native-webrtc';

function VideoCall() {
  const peerConnection = new RTCPeerConnection(config);

  return (
    <SmartCamera
      camera="front"
      webrtc={{
        enabled: true,
        peerConnection,
        mode: 'call',
      }}
      style={{ flex: 1 }}
    />
  );
}
```

## API Reference

### SmartCamera Props

```tsx
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

### Face Detection Options

#### Common Options (Frame Processor and Static Images)

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `performanceMode` | Favor speed or accuracy when detecting faces | `'fast'` | `'fast'`, `'accurate'` |
| `landmarkMode` | Whether to identify facial landmarks: eyes, ears, nose, cheeks, mouth | `'none'` | `'none'`, `'all'` |
| `contourMode` | Whether to detect contours of facial features. Contours are detected for only the most prominent face in an image | `'none'` | `'none'`, `'all'` |
| `classificationMode` | Whether to classify faces into categories such as 'smiling' and 'eyes open' | `'none'` | `'none'`, `'all'` |
| `minFaceSize` | Sets the smallest desired face size, expressed as the ratio of the width of the head to width of the image | `0.15` | `number` |
| `trackingEnabled` | Whether to assign faces an ID to track faces across images. Note: Don't enable with contourMode for best performance | `false` | `boolean` |

#### Frame Processor Options

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `cameraFacing` | Current active camera | `'front'` | `'front'`, `'back'` |
| `autoMode` | Handle auto scale (face bounds, contour, landmarks) and rotation on native side. If disabled, results are relative to frame coordinates, not screen/preview. Disable when using Skia Frame Processor | `false` | `boolean` |
| `windowWidth` | Required when using `autoMode`. Screen width for coordinate scaling | `1.0` | `number` |
| `windowHeight` | Required when using `autoMode`. Screen height for coordinate scaling | `1.0` | `number` |

#### Static Images

| Option | Description | Default | Options |
|--------|-------------|---------|---------|
| `image` | Image source for static face detection | - | `number`, `string`, `{ uri: string }` |

### Types

```tsx
interface BlinkEvent {
  timestamp: number;
  leftEyeOpen: number;  // 0.0 - 1.0
  rightEyeOpen: number; // 0.0 - 1.0
  isBlink: boolean;
  faceId?: number;
}

interface Face {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: FaceLandmarks;
  contours?: FaceContours;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  trackingId?: number;
}

interface WebRTCConfig {
  enabled: boolean;
  peerConnection?: RTCPeerConnection;
  mode?: 'call' | 'stream';
}
```

### Static Image Detection

```tsx
import { detectFacesInImage } from 'react-native-smart-camera';

const faces = await detectFacesInImage({
  image: require('./photo.jpg'),
  performanceMode: 'accurate',
  landmarkMode: 'all',
});
```

## Hooks

### useSmartCamera

```tsx
import { useSmartCamera } from 'react-native-smart-camera';

const { 
  hasPermission,
  requestPermission,
  device,
  switchCamera,
} = useSmartCamera();
```

### useFaceDetection

```tsx
import { useFaceDetection } from 'react-native-smart-camera';

const { faces, isDetecting } = useFaceDetection({
  performanceMode: 'fast',
  classificationMode: 'all',
});
```

### useBlinkDetection

```tsx
import { useBlinkDetection } from 'react-native-smart-camera';

const { lastBlink, blinkCount } = useBlinkDetection({
  debounceMs: 300,
});
```

### useSmartCameraWebRTC

```tsx
import { useSmartCameraWebRTC } from 'react-native-smart-camera';

const {
  videoTrack,
  startStreaming,
  stopStreaming,
  switchCamera,
} = useSmartCameraWebRTC({
  peerConnection,
  mode: 'call',
});
```

## Expo Config Plugin

This package includes an Expo config plugin that automatically configures permissions and native dependencies.

```json
{
  "expo": {
    "plugins": ["react-native-smart-camera"]
  }
}
```

The plugin automatically adds:
- Camera permission (iOS & Android)
- Microphone permission (iOS & Android)
- Required iOS frameworks
- Android ProGuard rules for ML Kit

## Architecture

```
Expo App
 ├── SmartCamera (JS Component)
 ├── VisionCamera (native camera)
 ├── Frame Processor (worklet)
 │     └── ML Kit Face Detection
 ├── Native WebRTC Bridge
 │     ├── iOS (Swift)
 │     └── Android (Kotlin)
 └── react-native-webrtc
```

## Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "react-native-vision-camera": ">=3.0.0",
  "react-native-webrtc": ">=118.0.0",
  "react-native-worklets-core": ">=1.0.0"
}
```

## Limitations

- ❌ Not supported in Expo Go
- ❌ Requires Expo Dev Client or Bare Workflow
- ❌ Native build required (via `expo run:ios/android` or EAS Build)

## License

MIT

