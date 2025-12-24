# @arfuhad/react-native-smart-camera

A React Native package providing real-time face detection using VisionCamera + ML Kit, eye tracking for blink detection, and WebRTC video calling capabilities.

## Features

- **Face Detection** - Real-time face detection using Google ML Kit via VisionCamera frame processor
- **Eye Tracking** - Track eye open/close probability for blink detection
- **WebRTC Video Calling** - Full-featured WebRTC integration for peer-to-peer video calls
- **Expo Compatible** - Works with Expo Dev Client and EAS Build

## Requirements

- React Native ≥ 0.72
- Expo SDK ≥ 49 (if using Expo)
- Expo Dev Client (Expo Go not supported)

| Workflow | Supported | Notes |
|----------|-----------|-------|
| Expo Go | ❌ No | Requires native modules |
| Expo Dev Client | ✅ Yes | Recommended |
| Bare React Native | ✅ Yes | Full native control |

## Installation

```bash
npm install @arfuhad/react-native-smart-camera

# Peer dependencies
npm install react-native-vision-camera react-native-worklets-core

# Optional: For WebRTC video calling
npm install react-native-webrtc
```

For Expo:
```bash
npx expo prebuild
npx expo run:ios  # or run:android
```

## Quick Start

### Face Detection with Eye Tracking

```tsx
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { useFaceDetector, useBlinkDetection, type Face } from '@arfuhad/react-native-smart-camera';

function FaceDetectionScreen() {
  const device = useCameraDevice('front');
  
  // Face detector
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    classificationMode: 'all', // Required for eye tracking
  });
  
  // Eye tracking with custom threshold
  const { eyeStatus, processEyeStatus } = useBlinkDetection({
    eyeClosedThreshold: 0.3, // Eyes considered closed below this value
    onEyeStatusChange: (status) => {
      console.log('Left eye:', status.leftEye.openProbability);
      console.log('Right eye:', status.rightEye.openProbability);
    },
  });

  const handleFaces = useRunOnJS((faces: Face[]) => {
    processEyeStatus(faces);
  }, [processEyeStatus]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    handleFaces(faces);
  }, [detectFaces, handleFaces]);

  return (
    <Camera
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      style={{ flex: 1 }}
    />
  );
}
```

### WebRTC Video Calling

```tsx
import { useWebRTC } from '@arfuhad/react-native-smart-camera';
import { RTCView } from 'react-native-webrtc';
import { io } from 'socket.io-client';

function VideoCallScreen() {
  const socket = io('http://your-signaling-server:3000');
  
  const {
    localStream,
    remoteStream,
    callState,
    startLocalStream,
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    onIceCandidate,
    switchCamera,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useWebRTC({
    config: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    },
  });

  // Start a call
  const startCall = async (peerId: string) => {
    await startLocalStream();
    createPeerConnection();
    
    onIceCandidate((event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: peerId });
      }
    });
    
    const offer = await createOffer();
    socket.emit('offer', { offer, to: peerId });
  };

  // Handle incoming offer
  useEffect(() => {
    socket.on('offer', async ({ offer, from }) => {
      await startLocalStream();
      createPeerConnection();
      await setRemoteDescription(offer);
      const answer = await createAnswer();
      socket.emit('answer', { answer, to: from });
    });

    socket.on('answer', ({ answer }) => {
      setRemoteDescription(answer);
    });

    socket.on('ice-candidate', ({ candidate }) => {
      addIceCandidate(candidate);
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} style={{ flex: 1 }} />
      )}
      {localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
      )}
      <View style={styles.controls}>
        <Button onPress={switchCamera} title="Switch Camera" />
        <Button onPress={toggleAudio} title="Mute" />
        <Button onPress={toggleVideo} title="Video Off" />
      </View>
    </View>
  );
}
```

### Combined: Video Call with Face Detection

```tsx
import { useWebRTCWithDetection } from '@arfuhad/react-native-smart-camera';

function VideoCallWithDetection() {
  const {
    // WebRTC
    localStream,
    remoteStream,
    startLocalStream,
    createPeerConnection,
    // Face detection
    faces,
    detectFaces,
    // Eye tracking
    eyeStatus,
    processFrame,
  } = useWebRTCWithDetection({
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    faceDetection: { enabled: true, classificationMode: 'all' },
    eyeTracking: { enabled: true, eyeClosedThreshold: 0.3 },
  });

  // Use VisionCamera for detection + WebRTC for streaming
}
```

## API Reference

### Hooks

#### `useFaceDetector(options)`

Face detection for VisionCamera frame processor.

```tsx
const { detectFaces } = useFaceDetector({
  performanceMode: 'fast' | 'accurate',
  landmarkMode: 'none' | 'all',
  contourMode: 'none' | 'all',
  classificationMode: 'none' | 'all',  // Required for eye tracking
  trackingEnabled: boolean,
  cameraFacing: 'front' | 'back',
});
```

#### `useBlinkDetection(options)`

Eye tracking and status monitoring.

```tsx
const { eyeStatus, processEyeStatus, reset } = useBlinkDetection({
  enabled: boolean,
  eyeClosedThreshold: number,  // 0-1, default 0.5
  onEyeStatusChange: (status: EyeStatusResult) => void,
});

// EyeStatusResult
interface EyeStatusResult {
  leftEye: { openProbability: number; isClosed: boolean };
  rightEye: { openProbability: number; isClosed: boolean };
  faceId?: number;
  timestamp: number;
}
```

#### `useWebRTC(options)`

WebRTC video calling with signaling helpers.

```tsx
const {
  // Streams
  localStream,
  remoteStream,
  
  // State
  callState,  // 'idle' | 'connecting' | 'connected' | 'disconnected'
  isAudioEnabled,
  isVideoEnabled,
  currentCamera,
  
  // Local stream
  startLocalStream,
  stopLocalStream,
  switchCamera,
  toggleAudio,
  toggleVideo,
  
  // Peer connection
  createPeerConnection,
  closePeerConnection,
  
  // Signaling (integrate with your server)
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  onIceCandidate,
  
  // Cleanup
  cleanup,
} = useWebRTC({
  config: PeerConnectionConfig,
  mediaConstraints: MediaConstraints,
  onCallStateChange: (state) => void,
  onRemoteStream: (stream) => void,
  onError: (error) => void,
});
```

#### `useWebRTCWithDetection(options)`

Combined WebRTC + face detection + eye tracking.

### Types

```tsx
interface Face {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: FaceLandmarks;
  contours?: FaceContours;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  trackingId?: number;
}

interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface PeerConnectionConfig {
  iceServers?: ICEServer[];
  iceTransportPolicy?: 'all' | 'relay';
}

interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}
```

## Expo Config Plugin

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": ["@arfuhad/react-native-smart-camera"]
  }
}
```

The plugin automatically configures:
- Camera and microphone permissions (iOS & Android)
- Required iOS frameworks
- Android ProGuard rules for ML Kit

## Peer Dependencies

```json
{
  "react-native-vision-camera": ">=3.0.0",
  "react-native-worklets-core": ">=1.0.0",
  "react-native-webrtc": ">=118.0.0"  // Optional, for video calling
}
```

## Example App

See the `smart-camera-example` directory for a complete example with:
- Face detection with eye tracking
- WebRTC video calling with Socket.io signaling

## Limitations

- ❌ Not supported in Expo Go
- ❌ Requires native build (Expo Dev Client or bare workflow)

## License

MIT
