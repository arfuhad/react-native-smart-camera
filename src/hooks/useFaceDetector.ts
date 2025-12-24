import { useCallback, useRef, useEffect, useState } from 'react';
import { useRunOnJS } from 'react-native-worklets-core';
import type { Frame } from 'react-native-vision-camera';
import { detectFaces } from '../detection/faceDetector';
import type { Face, FaceDetectionOptions, CameraFacing } from '../types';

/**
 * Face detection options for useFaceDetector hook
 * Matches the API of react-native-vision-camera-face-detector
 */
export interface UseFaceDetectorOptions extends FaceDetectionOptions {
  /**
   * Current active camera
   * @default 'front'
   */
  cameraFacing?: CameraFacing;

  /**
   * Should handle auto scale on native side?
   * If disabled, results are relative to frame coordinates, not screen/preview.
   * Don't use this if you want to draw with Skia Frame Processor.
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

/**
 * Return type for useFaceDetector hook
 */
export interface UseFaceDetectorResult {
  /**
   * Detect faces in a frame (for use in frame processor)
   */
  detectFaces: (frame: Frame) => Face[];
}

/**
 * Hook for face detection in VisionCamera frame processors.
 * 
 * This hook provides a `detectFaces` function that can be used directly
 * in a frame processor to detect faces in each frame.
 * 
 * @param options - Face detection options
 * @returns Object with detectFaces function
 * 
 * @example
 * ```tsx
 * import { useFaceDetector } from '@arfuhad/react-native-smart-camera';
 * import { useFrameProcessor } from 'react-native-vision-camera';
 * import Worklets from 'react-native-worklets-core';
 * 
 * function FaceDetectionCamera() {
 *   const { detectFaces } = useFaceDetector({
 *     performanceMode: 'fast',
 *     classificationMode: 'all', // Required for blink detection
 *   });
 *   
 *   const handleFaces = Worklets.createRunOnJS((faces: Face[]) => {
 *     console.log('Detected faces:', faces.length);
 *     // Check for blinks using leftEyeOpenProbability / rightEyeOpenProbability
 *   });
 *   
 *   const frameProcessor = useFrameProcessor((frame) => {
 *     'worklet';
 *     const faces = detectFaces(frame);
 *     handleFaces(faces);
 *   }, [detectFaces, handleFaces]);
 *   
 *   return <Camera frameProcessor={frameProcessor} />;
 * }
 * ```
 */
export function useFaceDetector(options: UseFaceDetectorOptions = {}): UseFaceDetectorResult {
  const optionsRef = useRef(options);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Create detect function that uses current options
  const detect = useCallback((frame: Frame): Face[] => {
    'worklet';
    return detectFaces(frame, {
      performanceMode: optionsRef.current.performanceMode,
      landmarkMode: optionsRef.current.landmarkMode,
      contourMode: optionsRef.current.contourMode,
      classificationMode: optionsRef.current.classificationMode,
      minFaceSize: optionsRef.current.minFaceSize,
      trackingEnabled: optionsRef.current.trackingEnabled,
      cameraFacing: optionsRef.current.cameraFacing,
      autoMode: optionsRef.current.autoMode,
      windowWidth: optionsRef.current.windowWidth,
      windowHeight: optionsRef.current.windowHeight,
    });
  }, []);
  
  return {
    detectFaces: detect,
  };
}

/**
 * Callback type for face detection
 */
export type FaceDetectionCallback = (faces: Face[]) => void;

/**
 * Options for useFaceDetectorWithCallback hook
 */
export interface UseFaceDetectorWithCallbackOptions extends UseFaceDetectorOptions {
  /**
   * Callback when faces are detected
   */
  onFacesDetected?: FaceDetectionCallback;
}

/**
 * Hook for face detection with automatic callback handling
 * 
 * This is a convenience hook that wraps useFaceDetector and automatically
 * calls your callback function when faces are detected.
 * 
 * @param options - Face detection options with callback
 * @returns Object with detectFaces function for use in frame processor
 * 
 * @example
 * ```tsx
 * import { useFaceDetectorWithCallback } from '@arfuhad/react-native-smart-camera';
 * 
 * function FaceDetectionCamera() {
 *   const [faces, setFaces] = useState<Face[]>([]);
 *   
 *   const { detectFaces } = useFaceDetectorWithCallback({
 *     classificationMode: 'all',
 *     onFacesDetected: (detectedFaces) => {
 *       setFaces(detectedFaces);
 *     },
 *   });
 *   
 *   const frameProcessor = useFrameProcessor((frame) => {
 *     'worklet';
 *     detectFaces(frame); // Automatically calls onFacesDetected
 *   }, [detectFaces]);
 *   
 *   return <Camera frameProcessor={frameProcessor} />;
 * }
 * ```
 */
export function useFaceDetectorWithCallback(
  options: UseFaceDetectorWithCallbackOptions = {}
): UseFaceDetectorResult {
  const { onFacesDetected, ...detectorOptions } = options;
  const { detectFaces: baseDet } = useFaceDetector(detectorOptions);
  const callbackRef = useRef(onFacesDetected);
  
  useEffect(() => {
    callbackRef.current = onFacesDetected;
  }, [onFacesDetected]);
  
  // Create runOnJS callback
  const handleFacesDetected = useRunOnJS((faces: Face[]) => {
    callbackRef.current?.(faces);
  }, []);
  
  const detectWithCallback = useCallback((frame: Frame): Face[] => {
    'worklet';
    const faces = baseDet(frame);
    if (faces.length > 0 || callbackRef.current) {
      handleFacesDetected(faces);
    }
    return faces;
  }, [baseDet, handleFacesDetected]);
  
  return {
    detectFaces: detectWithCallback,
  };
}

