// Camera management
export { useSmartCamera, getAvailableCameras } from './useSmartCamera';

// Face detection
export { useFaceDetection, type UseFaceDetectionOptions } from './useFaceDetection';
export { 
  useFaceDetector, 
  useFaceDetectorWithCallback,
  type UseFaceDetectorOptions,
  type UseFaceDetectorResult,
  type UseFaceDetectorWithCallbackOptions,
  type FaceDetectionCallback,
} from './useFaceDetector';

// Eye/Blink detection
export { useBlinkDetection, type UseBlinkDetectionOptions } from './useBlinkDetection';

// WebRTC video calling
export { useWebRTC } from './useWebRTC';
export type { UseWebRTCOptions, UseWebRTCResult } from './useWebRTC';
export { useWebRTCWithDetection } from './useWebRTCWithDetection';
export type { UseWebRTCWithDetectionOptions } from './useWebRTCWithDetection';
export type { UseWebRTCWithDetectionResult } from './useWebRTCWithDetection';

// Legacy WebRTC hook (deprecated, use useWebRTC instead)
export { useSmartCameraWebRTC, type UseSmartCameraWebRTCOptions } from './useSmartCameraWebRTC';
