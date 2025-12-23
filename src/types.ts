import type { ViewStyle } from 'react-native';

// ============================================================================
// Face Detection Options
// ============================================================================

/**
 * Performance mode for face detection
 * - 'fast': Favor speed over accuracy
 * - 'accurate': Favor accuracy over speed
 */
export type PerformanceMode = 'fast' | 'accurate';

/**
 * Mode for detecting facial landmarks
 * - 'none': Don't detect landmarks
 * - 'all': Detect all landmarks (eyes, ears, nose, cheeks, mouth)
 */
export type LandmarkMode = 'none' | 'all';

/**
 * Mode for detecting facial contours
 * - 'none': Don't detect contours
 * - 'all': Detect contours (only for most prominent face)
 */
export type ContourMode = 'none' | 'all';

/**
 * Mode for face classification
 * - 'none': Don't classify faces
 * - 'all': Classify faces (smiling, eyes open)
 */
export type ClassificationMode = 'none' | 'all';

/**
 * Camera facing direction
 */
export type CameraFacing = 'front' | 'back';

/**
 * Common face detection options shared between frame processor and static images
 */
export interface FaceDetectionOptions {
  /**
   * Favor speed or accuracy when detecting faces
   * @default 'fast'
   */
  performanceMode?: PerformanceMode;

  /**
   * Whether to identify facial landmarks: eyes, ears, nose, cheeks, mouth
   * @default 'none'
   */
  landmarkMode?: LandmarkMode;

  /**
   * Whether to detect contours of facial features.
   * Contours are detected for only the most prominent face in an image.
   * @default 'none'
   */
  contourMode?: ContourMode;

  /**
   * Whether to classify faces into categories such as 'smiling' and 'eyes open'
   * @default 'none'
   */
  classificationMode?: ClassificationMode;

  /**
   * Sets the smallest desired face size, expressed as the ratio
   * of the width of the head to width of the image.
   * @default 0.15
   */
  minFaceSize?: number;

  /**
   * Whether to assign faces an ID to track faces across images.
   * Note: When contour detection is enabled, only one face is detected,
   * so face tracking doesn't produce useful results. Don't enable both
   * contour detection and face tracking for best performance.
   * @default false
   */
  trackingEnabled?: boolean;
}

/**
 * Frame processor specific options
 */
export interface FrameProcessorOptions extends FaceDetectionOptions {
  /**
   * Current active camera
   * @default 'front'
   */
  cameraFacing?: CameraFacing;

  /**
   * Should handle auto scale (face bounds, contour and landmarks) and rotation
   * on native side? If disabled, all detection results will be relative to frame
   * coordinates, not to screen/preview.
   * You shouldn't use this option if you want to draw on screen using Skia Frame Processor.
   * @default false
   */
  autoMode?: boolean;

  /**
   * Required if you want to use autoMode. Screen width for coordinate scaling.
   * You must handle your own logic to get screen sizes, with or without statusbar size, etc.
   * @default 1.0
   */
  windowWidth?: number;

  /**
   * Required if you want to use autoMode. Screen height for coordinate scaling.
   * You must handle your own logic to get screen sizes, with or without statusbar size, etc.
   * @default 1.0
   */
  windowHeight?: number;
}

/**
 * Static image face detection options
 */
export interface StaticImageOptions extends FaceDetectionOptions {
  /**
   * Image source for static face detection.
   * Can be a require() result (number), a URI string, or an object with uri.
   */
  image: number | string | { uri: string };
}

// ============================================================================
// Face Detection Results
// ============================================================================

/**
 * 2D point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounding rectangle
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Facial landmarks detected by ML Kit
 */
export interface FaceLandmarks {
  leftEye?: Point;
  rightEye?: Point;
  leftEar?: Point;
  rightEar?: Point;
  leftCheek?: Point;
  rightCheek?: Point;
  noseBase?: Point;
  leftMouth?: Point;
  rightMouth?: Point;
  bottomMouth?: Point;
}

/**
 * Face contour types
 */
export type ContourType =
  | 'face'
  | 'leftEyebrowTop'
  | 'leftEyebrowBottom'
  | 'rightEyebrowTop'
  | 'rightEyebrowBottom'
  | 'leftEye'
  | 'rightEye'
  | 'upperLipTop'
  | 'upperLipBottom'
  | 'lowerLipTop'
  | 'lowerLipBottom'
  | 'noseBridge'
  | 'noseBottom'
  | 'leftCheek'
  | 'rightCheek';

/**
 * Facial contours detected by ML Kit
 */
export interface FaceContours {
  [key: string]: Point[];
}

/**
 * Detected face data
 */
export interface Face {
  /**
   * Bounding box of the detected face
   */
  bounds: Bounds;

  /**
   * Roll angle of the face (rotation around front-to-back axis)
   */
  rollAngle?: number;

  /**
   * Pitch angle of the face (rotation around left-to-right axis)
   */
  pitchAngle?: number;

  /**
   * Yaw angle of the face (rotation around top-to-bottom axis)
   */
  yawAngle?: number;

  /**
   * Facial landmarks (when landmarkMode is 'all')
   */
  landmarks?: FaceLandmarks;

  /**
   * Facial contours (when contourMode is 'all')
   */
  contours?: FaceContours;

  /**
   * Probability that the face is smiling (0.0 - 1.0)
   * Only available when classificationMode is 'all'
   */
  smilingProbability?: number;

  /**
   * Probability that the left eye is open (0.0 - 1.0)
   * Only available when classificationMode is 'all'
   */
  leftEyeOpenProbability?: number;

  /**
   * Probability that the right eye is open (0.0 - 1.0)
   * Only available when classificationMode is 'all'
   */
  rightEyeOpenProbability?: number;

  /**
   * Tracking ID for this face (when trackingEnabled is true)
   */
  trackingId?: number;
}

// ============================================================================
// Blink Detection
// ============================================================================

/**
 * Blink detection event
 */
export interface BlinkEvent {
  /**
   * Timestamp when the blink was detected
   */
  timestamp: number;

  /**
   * Left eye open probability (0.0 - 1.0)
   */
  leftEyeOpen: number;

  /**
   * Right eye open probability (0.0 - 1.0)
   */
  rightEyeOpen: number;

  /**
   * Whether a blink was detected
   */
  isBlink: boolean;

  /**
   * Face tracking ID (when trackingEnabled is true)
   */
  faceId?: number;
}

// ============================================================================
// WebRTC Configuration
// ============================================================================

/**
 * WebRTC mode
 * - 'call': Video calling (1:1 or group)
 * - 'stream': Live streaming to a server
 */
export type WebRTCMode = 'call' | 'stream';

/**
 * WebRTC video constraints
 */
export interface VideoConstraints {
  width?: number;
  height?: number;
  frameRate?: number;
}

/**
 * WebRTC configuration
 */
export interface WebRTCConfig {
  /**
   * Whether WebRTC is enabled
   */
  enabled: boolean;

  /**
   * RTCPeerConnection instance
   */
  peerConnection?: RTCPeerConnection;

  /**
   * WebRTC mode (call or stream)
   * @default 'call'
   */
  mode?: WebRTCMode;

  /**
   * Video constraints for the stream
   */
  videoConstraints?: VideoConstraints;
}

// ============================================================================
// Face Detection Configuration (for SmartCamera component)
// ============================================================================

/**
 * Face detection configuration for SmartCamera component
 */
export interface FaceDetectionConfig extends FaceDetectionOptions {
  /**
   * Whether face detection is enabled
   * @default false
   */
  enabled?: boolean;

  /**
   * Handle auto scale on native side
   * @default false
   */
  autoMode?: boolean;

  /**
   * Screen width for coordinate scaling (required when autoMode is true)
   * @default 1.0
   */
  windowWidth?: number;

  /**
   * Screen height for coordinate scaling (required when autoMode is true)
   * @default 1.0
   */
  windowHeight?: number;
}

// ============================================================================
// SmartCamera Component Props
// ============================================================================

/**
 * SmartCamera component props
 */
export interface SmartCameraProps {
  /**
   * Camera facing direction
   * @default 'front'
   */
  camera?: CameraFacing;

  /**
   * Target frame rate for the camera
   * @default 30
   */
  fps?: number;

  /**
   * Style for the camera view
   */
  style?: ViewStyle;

  /**
   * Face detection configuration
   */
  faceDetection?: FaceDetectionConfig;

  /**
   * Whether blink detection is enabled
   * @default false
   */
  blinkDetection?: boolean;

  /**
   * Callback when a blink is detected
   */
  onBlinkDetected?: (event: BlinkEvent) => void;

  /**
   * Callback when faces are detected
   */
  onFaceDetected?: (faces: Face[]) => void;

  /**
   * WebRTC configuration for streaming
   */
  webrtc?: WebRTCConfig;

  /**
   * Whether the camera is active
   * @default true
   */
  isActive?: boolean;

  /**
   * Callback when camera is ready
   */
  onReady?: () => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: SmartCameraError) => void;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Error codes for SmartCamera
 */
export type SmartCameraErrorCode =
  | 'CAMERA_UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'WEBRTC_ERROR'
  | 'ML_KIT_ERROR'
  | 'FRAME_PROCESSOR_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * SmartCamera error
 */
export interface SmartCameraError {
  /**
   * Error code
   */
  code: SmartCameraErrorCode;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Original native error (if available)
   */
  nativeError?: Error;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useSmartCameraWebRTC hook
 */
export interface UseSmartCameraWebRTCResult {
  /**
   * The video track for WebRTC
   */
  videoTrack: MediaStreamTrack | null;

  /**
   * Start streaming to the peer connection
   */
  startStreaming: () => void;

  /**
   * Stop streaming
   */
  stopStreaming: () => void;

  /**
   * Switch between front and back camera
   */
  switchCamera: () => void;

  /**
   * Whether streaming is active
   */
  isStreaming: boolean;
}

/**
 * Return type for useFaceDetection hook
 */
export interface UseFaceDetectionResult {
  /**
   * Currently detected faces
   */
  faces: Face[];

  /**
   * Whether face detection is active/detecting
   */
  isDetecting: boolean;
}

/**
 * Return type for useBlinkDetection hook
 */
export interface UseBlinkDetectionResult {
  /**
   * Last blink event
   */
  lastBlink: BlinkEvent | null;

  /**
   * Total blink count
   */
  blinkCount: number;

  /**
   * Reset blink count
   */
  resetCount: () => void;
}

// ============================================================================
// Camera Device Types
// ============================================================================

/**
 * Camera device information
 */
export interface CameraDevice {
  /**
   * Unique identifier for the camera device
   */
  id: string;

  /**
   * Human-readable name of the camera
   */
  name: string;

  /**
   * Camera position (front or back)
   */
  position: CameraFacing;

  /**
   * Whether the camera has a flash
   */
  hasFlash: boolean;

  /**
   * Whether the camera has a torch (flashlight)
   */
  hasTorch: boolean;

  /**
   * Whether the camera supports low-light boost
   */
  supportsLowLightBoost: boolean;
}

/**
 * Return type for useSmartCamera hook
 */
export interface UseSmartCameraResult {
  /**
   * Whether camera permission has been granted
   */
  hasPermission: boolean;

  /**
   * Request camera permission
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Current camera device
   */
  device: CameraDevice | undefined;

  /**
   * Switch between front and back camera
   */
  switchCamera: () => void;

  /**
   * Current camera facing direction
   */
  currentCamera: CameraFacing;
}

// ============================================================================
// Orientation Types
// ============================================================================

/**
 * Device orientation
 */
export type Orientation = 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right';

/**
 * Camera output orientation
 */
export type OutputOrientation = Orientation | 'device';
