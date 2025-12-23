import { requireNativeModule, EventEmitter } from 'expo-modules-core';

import type { Face, StaticImageOptions, VideoConstraints } from './types';

// Define the native module interface
interface SmartCameraModuleInterface {
  // Face detection in static images
  detectFacesInImage(options: StaticImageOptions): Promise<Face[]>;

  // Update face detection options
  updateFaceDetectionOptions(options: Record<string, unknown>): void;

  // WebRTC functions
  initializeWebRTC(): Promise<boolean>;
  startWebRTCStream(constraints: VideoConstraints): Promise<boolean>;
  stopWebRTCStream(): void;
  pushWebRTCFrame(frameData: Record<string, unknown>): void;
  isWebRTCStreaming(): boolean;

  // Native module constants
  readonly PI: number;
  readonly DEFAULT_MIN_FACE_SIZE: number;
  readonly EYE_CLOSED_THRESHOLD: number;
  readonly EYE_OPEN_THRESHOLD: number;

  // Allow additional properties from NativeModule
  __expo_module_name__?: string;
  startObserving?: () => void;
  stopObserving?: () => void;
  addListener?: unknown;
  removeListeners?: unknown;
  [key: string]: unknown;
}

// Require the native module
const SmartCameraModule = requireNativeModule<SmartCameraModuleInterface>('SmartCameraModule');

// Create an event emitter for native events
const emitter = new EventEmitter(SmartCameraModule);

// ============================================================================
// Face Detection Functions
// ============================================================================

/**
 * Detect faces in a static image
 * @param options - Static image options including the image source and detection settings
 * @returns Promise resolving to an array of detected faces
 * 
 * @example
 * ```tsx
 * const faces = await detectFacesInImage({
 *   image: { uri: 'https://example.com/photo.jpg' },
 *   performanceMode: 'accurate',
 *   landmarkMode: 'all',
 * });
 * console.log(`Detected ${faces.length} faces`);
 * ```
 */
export async function detectFacesInImage(options: StaticImageOptions): Promise<Face[]> {
  return SmartCameraModule.detectFacesInImage(options);
}

/**
 * Update face detection options at runtime
 * @param options - New face detection options
 */
export function updateFaceDetectionOptions(options: Record<string, unknown>): void {
  SmartCameraModule.updateFaceDetectionOptions(options);
}

// ============================================================================
// WebRTC Functions
// ============================================================================

/**
 * Initialize WebRTC for streaming
 * Must be called before startWebRTCStream
 * @returns Promise resolving to true if initialized successfully
 */
export async function initializeWebRTC(): Promise<boolean> {
  return SmartCameraModule.initializeWebRTC();
}

/**
 * Start WebRTC video streaming
 * @param constraints - Video constraints (width, height, frameRate)
 * @returns Promise resolving to true if started successfully
 */
export async function startWebRTCStream(constraints: VideoConstraints): Promise<boolean> {
  return SmartCameraModule.startWebRTCStream(constraints);
}

/**
 * Stop WebRTC video streaming
 */
export function stopWebRTCStream(): void {
  SmartCameraModule.stopWebRTCStream();
}

/**
 * Push a frame to the WebRTC stream
 * @param frameData - Frame data to push
 */
export function pushWebRTCFrame(frameData: Record<string, unknown>): void {
  SmartCameraModule.pushWebRTCFrame(frameData);
}

/**
 * Check if WebRTC is currently streaming
 * @returns true if streaming, false otherwise
 */
export function isWebRTCStreaming(): boolean {
  return SmartCameraModule.isWebRTCStreaming();
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Subscribe to face detection events from native module
 * @param listener - Callback function for face detection events
 * @returns Subscription object with remove method
 */
export function addFaceDetectionListener(listener: (faces: Face[]) => void) {
  return emitter.addListener('onFacesDetected', listener);
}

/**
 * Subscribe to blink detection events from native module
 * @param listener - Callback function for blink events
 * @returns Subscription object with remove method
 */
export function addBlinkDetectionListener(
  listener: (event: { leftEyeOpen: number; rightEyeOpen: number; isBlink: boolean }) => void
) {
  return emitter.addListener('onBlinkDetected', listener);
}

/**
 * Subscribe to error events from native module
 * @param listener - Callback function for error events
 * @returns Subscription object with remove method
 */
export function addErrorListener(listener: (error: { code: string; message: string }) => void) {
  return emitter.addListener('onError', listener);
}

/**
 * Subscribe to WebRTC state change events
 * @param listener - Callback function for WebRTC state changes
 * @returns Subscription object with remove method
 */
export function addWebRTCStateChangeListener(listener: (state: { isStreaming: boolean }) => void) {
  return emitter.addListener('onWebRTCStateChange', listener);
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Module constants
 */
export const Constants = {
  PI: SmartCameraModule.PI,
  DEFAULT_MIN_FACE_SIZE: SmartCameraModule.DEFAULT_MIN_FACE_SIZE ?? 0.15,
  EYE_CLOSED_THRESHOLD: SmartCameraModule.EYE_CLOSED_THRESHOLD ?? 0.3,
  EYE_OPEN_THRESHOLD: SmartCameraModule.EYE_OPEN_THRESHOLD ?? 0.7,
};

export default SmartCameraModule;
