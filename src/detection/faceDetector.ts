import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import type { Face, FrameProcessorOptions } from '../types';

/**
 * Initialize the face detector frame processor plugin
 * This registers the native plugin with VisionCamera
 */
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaces', {});

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

  if (plugin == null) {
    // Plugin not available - return empty array
    // This can happen if the native module is not properly linked
    return [];
  }

  const mergedOptions: FrameProcessorOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {
    // Convert options to a format compatible with VisionCamera plugin API
    const pluginOptions: Record<string, string | number | boolean | undefined> = {
      performanceMode: mergedOptions.performanceMode,
      landmarkMode: mergedOptions.landmarkMode,
      contourMode: mergedOptions.contourMode,
      classificationMode: mergedOptions.classificationMode,
      minFaceSize: mergedOptions.minFaceSize,
      trackingEnabled: mergedOptions.trackingEnabled,
      cameraFacing: mergedOptions.cameraFacing,
      autoMode: mergedOptions.autoMode,
      windowWidth: mergedOptions.windowWidth,
      windowHeight: mergedOptions.windowHeight,
    };
    
    const result = plugin.call(frame, pluginOptions) as Face[] | null | undefined;
    return result ?? [];
  } catch (error) {
    // Return empty array on error in worklet context
    return [];
  }
}

/**
 * Check if the face detector plugin is available
 * @returns true if the plugin is registered and available
 */
export function isFaceDetectorAvailable(): boolean {
  return plugin != null;
}


