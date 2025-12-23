import type { Frame } from 'react-native-vision-camera';
import type { Face, FrameProcessorOptions } from '../types';

/**
 * Native face detection function placeholder
 * This will be implemented as a VisionCamera frame processor plugin
 */
declare function __detectFaces(frame: Frame, options: FrameProcessorOptions): Face[];

/**
 * Default face detection options
 */
const DEFAULT_OPTIONS: FrameProcessorOptions = {
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

/**
 * Detect faces in a camera frame
 * 
 * @param frame - The camera frame from VisionCamera
 * @param options - Face detection options
 * @returns Array of detected faces
 */
export function detectFaces(frame: Frame, options?: Partial<FrameProcessorOptions>): Face[] {
  'worklet';

  const mergedOptions: FrameProcessorOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {
    return __detectFaces(frame, mergedOptions);
  } catch (error) {
    // Return empty array on error in worklet context
    return [];
  }
}

/**
 * Register the face detection frame processor plugin
 * This is called during module initialization
 */
export function registerFaceDetectorPlugin(): void {
  // The native plugin registration happens automatically
  // through the Expo module system
  console.log('[SmartCamera] Face detector plugin registered');
}

