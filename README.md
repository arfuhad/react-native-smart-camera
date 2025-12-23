# react-native-smart-camera

Expo-compatible native module for camera preview, face detection, blink detection, and WebRTC streaming.

## Features

- 📷 Camera preview via VisionCamera
- 👁️ Real-time face detection with Google ML Kit
- 😉 Blink detection with configurable sensitivity
- 📡 Native WebRTC bridge for video calling and streaming
- 🔌 Expo config plugin for zero-config setup
- 📱 Static image face detection

## Expo Compatibility

| Expo Workflow   | Supported | Notes                              |
| --------------- | --------- | ---------------------------------- |
| Expo Managed    | ❌ No     | Requires native code               |
| Expo Dev Client | ✅ Yes    | Recommended for development        |
| Expo Bare       | ✅ Yes    | Full native control                |

**Requirements:**
- Expo SDK ≥ 49
- Expo Dev Client or Bare Workflow
- EAS Build or local native builds

## Installation

```bash
# Install the package
npx expo install react-native-smart-camera

# Install peer dependencies
npx expo install react-native-vision-camera react-native-webrtc react-native-worklets-core

# Rebuild native code
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Expo Config Plugin

Add to your `app.json` or `app.config.js`:

```json
{
  "plugins": [
    [
      "react-native-smart-camera",
      {
        "cameraPermissionText": "Allow camera access for face detection",
        "microphonePermissionText": "Allow microphone for audio streaming"
      }
    ]
  ]
}
```

## Usage

### Basic Camera Preview

```tsx
import { SmartCamera } from 'react-native-smart-camera';

export default function App() {
  return (
    <SmartCamera
      camera="front"
      style={{ flex: 1 }}
    />
  );
}
```

### Face Detection

```tsx
import { SmartCamera, Face } from 'react-native-smart-camera';

export default function App() {
  const handleFaces = (faces: Face[]) => {
    console.log(`Detected ${faces.length} faces`);
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
      onFaceDetected={handleFaces}
      style={{ flex: 1 }}
    />
  );
}
```

### Blink Detection

```tsx
import { SmartCamera, BlinkEvent } from 'react-native-smart-camera';

export default function App() {
  const handleBlink = (event: BlinkEvent) => {
    console.log('Blink detected!', event);
  };

  return (
    <SmartCamera
      camera="front"
      blinkDetection
      onBlinkDetected={handleBlink}
      style={{ flex: 1 }}
    />
  );
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

## Face Detection Options

| Option             | Description                                     | Default   | Options               |
| ------------------ | ----------------------------------------------- | --------- | --------------------- |
| `performanceMode`  | Speed vs accuracy trade-off                     | `'fast'`  | `'fast'`, `'accurate'`|
| `landmarkMode`     | Detect facial landmarks                         | `'none'`  | `'none'`, `'all'`     |
| `contourMode`      | Detect facial contours                          | `'none'`  | `'none'`, `'all'`     |
| `classificationMode` | Classify smiling/eyes open                    | `'none'`  | `'none'`, `'all'`     |
| `minFaceSize`      | Minimum face size ratio                         | `0.15`    | `number`              |
| `trackingEnabled`  | Track faces across frames                       | `false`   | `boolean`             |

## API Reference

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full API documentation.

## License

MIT
