// Main component
export { SmartCamera } from './SmartCamera';
export { default as SmartCameraModule } from './SmartCameraModule';

// Native module functions
export {
  detectFacesInImage,
  updateFaceDetectionOptions,
  initializeWebRTC,
  startWebRTCStream,
  stopWebRTCStream,
  pushWebRTCFrame,
  isWebRTCStreaming,
  addFaceDetectionListener,
  addBlinkDetectionListener,
  addErrorListener,
  addWebRTCStateChangeListener,
  Constants,
} from './SmartCameraModule';

// Types
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

  // Blink Detection
  BlinkEvent,

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

// Hooks
export { useSmartCamera, getAvailableCameras } from './hooks/useSmartCamera';
export { useFaceDetection } from './hooks/useFaceDetection';
export { useBlinkDetection } from './hooks/useBlinkDetection';
export { useSmartCameraWebRTC } from './hooks/useSmartCameraWebRTC';

// Frame processors
export { detectFaces } from './detection/faceDetector';
export { processBlinkFromFaces, resetBlinkStates, getEyeState } from './detection/blinkProcessor';

// Static image detection
export { detectFacesInImage as detectFacesInImageAsync } from './detection/staticImageDetector';

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

// WebRTC Bridge
export { WebRTCBridge, getWebRTCBridge } from './webrtc';
