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

  // WebRTC (from main types)
  WebRTCMode,
  VideoConstraints as WebRTCVideoConstraintsLegacy,
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

// Blink/Eye detection
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
// WEBRTC VIDEO CALLING (requires react-native-webrtc)
// =============================================================================

// Main WebRTC hook
export { useWebRTC } from './hooks/useWebRTC';
export type { UseWebRTCOptions, UseWebRTCResult } from './hooks/useWebRTC';

// Combined WebRTC + Face Detection hook
export { useWebRTCWithDetection } from './hooks/useWebRTCWithDetection';
export type { UseWebRTCWithDetectionOptions } from './hooks/useWebRTCWithDetection';
export type { UseWebRTCWithDetectionResult } from './hooks/useWebRTCWithDetection';

// WebRTC Manager class
export {
  WebRTCManager,
  getWebRTCManager,
  createWebRTCManager,
  isWebRTCAvailable,
} from './webrtc/WebRTCManager';

// WebRTC Types
export type {
  // Core types
  ICEServer,
  PeerConnectionConfig,
  VideoConstraints,
  AudioConstraints,
  MediaConstraints,
  
  // State types
  CallState,
  WebRTCConnectionState,
  ICEConnectionState,
  ICEGatheringState,
  SignalingState,
  
  // Stream types
  VideoFrameFormat,
  WebRTCVideoSourceConfig,
  WebRTCStreamStats,
  WebRTCQualitySettings,
  
  // Event types
  WebRTCStreamEvent,
  ICECandidateEvent,
  SessionDescription,
} from './webrtc/types';

// Default configurations
export {
  DEFAULT_ICE_SERVERS,
  DEFAULT_PEER_CONNECTION_CONFIG,
  DEFAULT_MEDIA_CONSTRAINTS,
} from './webrtc/types';

// =============================================================================
// LEGACY EXPORTS (deprecated - kept for backwards compatibility)
// =============================================================================

/** @deprecated Use useWebRTC instead */
export { useSmartCameraWebRTC, type UseSmartCameraWebRTCOptions } from './hooks/useSmartCameraWebRTC';
/** @deprecated Use WebRTCManager instead */
export { WebRTCBridge, getWebRTCBridge } from './webrtc';
