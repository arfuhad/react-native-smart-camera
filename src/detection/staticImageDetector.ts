import type { Face, StaticImageOptions } from '../types';

/**
 * Default options for static image face detection
 */
const DEFAULT_OPTIONS: Partial<StaticImageOptions> = {
  performanceMode: 'accurate',
  landmarkMode: 'none',
  contourMode: 'none',
  classificationMode: 'none',
  minFaceSize: 0.15,
  trackingEnabled: false,
};

/**
 * Detect faces in a static image
 * 
 * NOTE: Static image detection is currently not supported in the frame processor-only version.
 * This feature requires native module implementation.
 * For real-time face detection, use the `detectFaces` function with VisionCamera frame processor.
 * 
 * @param options - Image source and detection options
 * @returns Promise resolving to array of detected faces
 * 
 * @example
 * ```tsx
 * // This feature is not yet implemented
 * // For real-time detection, use:
 * import { detectFaces } from '@arfuhad/react-native-smart-camera';
 * 
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet';
 *   const faces = detectFaces(frame);
 * }, []);
 * ```
 */
export async function detectFacesInImage(options: StaticImageOptions): Promise<Face[]> {
  const mergedOptions: StaticImageOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // TODO: Implement static image detection
  // This requires either:
  // 1. A separate native module for static image processing
  // 2. Using react-native-ml-kit directly
  console.warn(
    '[SmartCamera] Static image detection is not yet implemented. ' +
    'For real-time face detection, use the detectFaces function with VisionCamera frame processor.'
  );
  
  return [];
}
