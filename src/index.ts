/**
 * @arfuhad/react-native-smart-camera
 * 
 * VisionCamera frame processor plugin for face detection, blink detection, and WebRTC streaming.
 * API designed to match react-native-vision-camera-face-detector.
 */

// =============================================================================
// PRIMARY EXPORTS (matching react-native-vision-camera-face-detector API)
// =============================================================================

// Frame processor function - use directly in useFrameProcessor
export { detectFaces, isFaceDetectorAvailable } from './detection/faceDetector';

// Hook for face detection (matches reference package API)
export { 
  useFaceDetector, 
  useFaceDetectorWithCallback,
  type UseFaceDetectorOptions,
  type UseFaceDetectorResult,
  type UseFaceDetectorWithCallbackOptions,
  type FaceDetectionCallback,
} from './hooks/useFaceDetector';

// =============================================================================
// TYPES (matching react-native-vision-camera-face-detector API)
// =============================================================================

export type {
  // Face Detection Options
  PerformanceMode,
  LandmarkMode,
  ContourMode,
  ClassificationMode,
  CameraFacing,
  FaceDetectionOptions,
  FrameProcessorOptions,
  StaticImageOptions,
  FaceDetectionConfig,

  // Face Detection Results
  Point,
  Bounds,
  FaceLandmarks,
  ContourType,
  FaceContours,
  Face,

  // Blink/Eye Detection
  BlinkEvent,
  EyeStatus,
  EyeStatusResult,

  // WebRTC
  WebRTCMode,
  VideoConstraints,
  WebRTCConfig,

  // Component Props
  SmartCameraProps,

  // Error Handling
  SmartCameraErrorCode,
  SmartCameraError,

  // Hook Return Types
  UseSmartCameraWebRTCResult,
  UseFaceDetectionResult,
  UseBlinkDetectionResult,
  UseSmartCameraResult,

  // Camera Device
  CameraDevice,

  // Orientation
  Orientation,
  OutputOrientation,
} from './types';

// =============================================================================
// ADDITIONAL FEATURES (our package only)
// =============================================================================

// Blink detection
export { useBlinkDetection, type UseBlinkDetectionOptions } from './hooks/useBlinkDetection';
export { processBlinkFromFaces, resetBlinkStates, getEyeState } from './detection/blinkProcessor';

// Camera management hooks
export { useSmartCamera, getAvailableCameras } from './hooks/useSmartCamera';
export { useFaceDetection, type UseFaceDetectionOptions } from './hooks/useFaceDetection';

// Static image detection
export { detectFacesInImage } from './detection/staticImageDetector';

// Utilities
export {
  createFpsLimiter,
  debounce,
  throttle,
  createObjectPool,
  createSmartCameraError,
  safeExecute,
  validateFaceDetectionOptions,
  createPerformanceMonitor,
} from './utils';

// =============================================================================
// WEBRTC (Optional - requires react-native-webrtc)
// =============================================================================

export { useSmartCameraWebRTC, type UseSmartCameraWebRTCOptions } from './hooks/useSmartCameraWebRTC';
export { WebRTCBridge, getWebRTCBridge } from './webrtc';
