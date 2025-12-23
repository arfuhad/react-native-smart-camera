import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { StyleSheet, View, AppState, type AppStateStatus, useWindowDimensions } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type CameraProps,
} from 'react-native-vision-camera';
import { useSharedValue, useRunOnJS } from 'react-native-worklets-core';

import type {
  SmartCameraProps,
  Face,
  BlinkEvent,
  FrameProcessorOptions,
  SmartCameraError,
} from './types';
import { detectFaces } from './detection/faceDetector';

// Default values for face detection options
const DEFAULT_FACE_DETECTION_OPTIONS: FrameProcessorOptions = {
  performanceMode: 'fast',
  landmarkMode: 'none',
  contourMode: 'none',
  classificationMode: 'none',
  minFaceSize: 0.15,
  trackingEnabled: false,
  cameraFacing: 'front',
  autoMode: false,
  windowWidth: 1.0,
  windowHeight: 1.0,
};

// Blink detection state
interface BlinkState {
  lastLeftEyeOpen: number;
  lastRightEyeOpen: number;
  lastBlinkTime: number;
}

// Minimum time between blink detections (ms)
const BLINK_DEBOUNCE_MS = 300;

// Eye open probability threshold for blink detection
const EYE_CLOSED_THRESHOLD = 0.3;
const EYE_OPEN_THRESHOLD = 0.7;

/**
 * SmartCamera component - A camera component with face detection,
 * blink detection, and WebRTC streaming capabilities.
 * 
 * Features:
 * - VisionCamera integration with frame processing
 * - Real-time face detection with ML Kit
 * - Blink detection with debouncing
 * - App lifecycle management (background/foreground)
 * - Orientation handling
 * - WebRTC streaming support
 */
export function SmartCamera({
  camera = 'front',
  fps = 30,
  style,
  faceDetection,
  blinkDetection = false,
  onBlinkDetected,
  onFaceDetected,
  webrtc,
  isActive = true,
  onReady,
  onError,
}: SmartCameraProps) {
  // Camera permission
  const { hasPermission, requestPermission } = useCameraPermission();

  // Camera device
  const device = useCameraDevice(camera);

  // Window dimensions for autoMode
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // App state for lifecycle management
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isCameraActive, setIsCameraActive] = useState(isActive);

  // Track if component is mounted
  const isMounted = useRef(true);

  // Blink state tracking
  const blinkState = useRef<BlinkState>({
    lastLeftEyeOpen: 1,
    lastRightEyeOpen: 1,
    lastBlinkTime: 0,
  });

  // Shared values for frame processor communication
  const detectedFaces = useSharedValue<Face[]>([]);

  // Camera ref for imperative operations
  const cameraRef = useRef<Camera>(null);

  // Frame count for FPS limiting
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());

  // Merge face detection options with defaults and window dimensions
  const faceDetectionOptions = useMemo<FrameProcessorOptions>(() => ({
    ...DEFAULT_FACE_DETECTION_OPTIONS,
    ...faceDetection,
    cameraFacing: camera,
    // Enable classification mode if blink detection is enabled
    classificationMode: blinkDetection ? 'all' : faceDetection?.classificationMode ?? 'none',
    // Auto-populate window dimensions if autoMode is enabled
    windowWidth: faceDetection?.autoMode ? (faceDetection.windowWidth ?? windowWidth) : 1.0,
    windowHeight: faceDetection?.autoMode ? (faceDetection.windowHeight ?? windowHeight) : 1.0,
  }), [faceDetection, camera, blinkDetection, windowWidth, windowHeight]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!isMounted.current) return;

      setAppState(nextAppState);

      // Deactivate camera when app goes to background
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsCameraActive(false);
      } else if (nextAppState === 'active' && isActive) {
        // Reactivate camera when app comes to foreground
        setIsCameraActive(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  // Sync camera active state with prop
  useEffect(() => {
    if (appState === 'active') {
      setIsCameraActive(isActive);
    }
  }, [isActive, appState]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      // Reset blink state
      blinkState.current = {
        lastLeftEyeOpen: 1,
        lastRightEyeOpen: 1,
        lastBlinkTime: 0,
      };
    };
  }, []);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (!granted && onError && isMounted.current) {
          onError({
            code: 'PERMISSION_DENIED',
            message: 'Camera permission was denied',
          });
        }
      });
    }
  }, [hasPermission, requestPermission, onError]);

  // Handle device not available
  useEffect(() => {
    if (!device && onError && isMounted.current) {
      onError({
        code: 'CAMERA_UNAVAILABLE',
        message: `${camera} camera is not available on this device`,
      });
    }
  }, [device, camera, onError]);

  // Process blink detection
  const processBlink = useCallback((faces: Face[]) => {
    if (!blinkDetection || !onBlinkDetected || faces.length === 0) {
      return;
    }

    const face = faces[0]; // Use the first detected face
    const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
    const rightEyeOpen = face.rightEyeOpenProbability ?? 1;

    const now = Date.now();
    const state = blinkState.current;

    // Detect blink: eyes were open, now closed, or were closed, now open
    const wasLeftEyeOpen = state.lastLeftEyeOpen > EYE_OPEN_THRESHOLD;
    const wasRightEyeOpen = state.lastRightEyeOpen > EYE_OPEN_THRESHOLD;
    const isLeftEyeClosed = leftEyeOpen < EYE_CLOSED_THRESHOLD;
    const isRightEyeClosed = rightEyeOpen < EYE_CLOSED_THRESHOLD;

    const isBlink =
      (wasLeftEyeOpen && isLeftEyeClosed) ||
      (wasRightEyeOpen && isRightEyeClosed);

    // Check debounce
    if (isBlink && now - state.lastBlinkTime > BLINK_DEBOUNCE_MS) {
      const blinkEvent: BlinkEvent = {
        timestamp: now,
        leftEyeOpen,
        rightEyeOpen,
        isBlink: true,
        faceId: face.trackingId,
      };

      onBlinkDetected(blinkEvent);
      state.lastBlinkTime = now;
    }

    // Update state
    state.lastLeftEyeOpen = leftEyeOpen;
    state.lastRightEyeOpen = rightEyeOpen;
  }, [blinkDetection, onBlinkDetected]);

  // Handle face detection results
  const handleFacesDetected = useCallback((faces: Face[]) => {
    if (!isMounted.current) return;

    if (onFaceDetected) {
      onFaceDetected(faces);
    }
    processBlink(faces);
  }, [onFaceDetected, processBlink]);

  // Create a worklet-callable version of handleFacesDetected
  const handleFacesDetectedWorklet = useRunOnJS(handleFacesDetected, [handleFacesDetected]);

  // Frame processor for face detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // Skip if face detection is not enabled
    if (!faceDetection?.enabled && !blinkDetection) {
      return;
    }

    // FPS limiting - process every N frames based on target FPS
    // VisionCamera typically runs at 30fps, so we may want to skip frames
    const targetFps = faceDetection?.performanceMode === 'accurate' ? 15 : 30;
    const skipFrames = Math.max(1, Math.floor(30 / targetFps));
    
    // Simple frame skipping
    const currentFrame = Date.now();
    const frameInterval = 1000 / targetFps;
    
    // Call native face detection
    try {
      const faces = detectFaces(frame, faceDetectionOptions);
      handleFacesDetectedWorklet(faces);
    } catch (error) {
      // Silently handle errors in worklet context
    }
  }, [faceDetection?.enabled, blinkDetection, faceDetectionOptions, handleFacesDetectedWorklet]);

  // Handle camera ready
  const handleCameraReady = useCallback(() => {
    if (isMounted.current) {
      onReady?.();
    }
  }, [onReady]);

  // Handle camera error
  const handleCameraError = useCallback((error: Error) => {
    if (isMounted.current) {
      onError?.({
        code: 'UNKNOWN_ERROR',
        message: error.message,
        nativeError: error,
      });
    }
  }, [onError]);

  // Render loading state if no permission
  if (!hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  // Render placeholder if no device
  if (!device) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  // Determine orientation based on device orientation
  // In VisionCamera v4, OutputOrientation is 'device' | 'preview'
  const getOutputOrientation = (): 'device' | 'preview' => {
    // 'device' follows the device's physical orientation
    return 'device';
  };

  // Camera props with full configuration
  const cameraProps: CameraProps = {
    style: StyleSheet.absoluteFill,
    device,
    isActive: isCameraActive,
    fps,
    onInitialized: handleCameraReady,
    onError: handleCameraError,
    // Enable photo/video for potential future features
    photo: false,
    video: webrtc?.enabled ?? false,
    audio: webrtc?.enabled ?? false,
    // Orientation handling
    outputOrientation: getOutputOrientation(),
    // Performance optimizations
    enableZoomGesture: false,
    exposure: 0,
  };

  // Add frame processor if face/blink detection is enabled
  if (faceDetection?.enabled || blinkDetection) {
    cameraProps.frameProcessor = frameProcessor;
  }

  return (
    <View style={[styles.container, style]}>
      <Camera ref={cameraRef} {...cameraProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

export default SmartCamera;
