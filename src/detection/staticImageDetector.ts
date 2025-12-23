import SmartCameraModule from '../SmartCameraModule';
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
 * @param options - Image source and detection options
 * @returns Promise resolving to array of detected faces
 * 
 * @example
 * ```tsx
 * // Using require
 * const faces = await detectFacesInImage({
 *   image: require('./photo.jpg'),
 *   performanceMode: 'accurate',
 *   landmarkMode: 'all',
 * });
 * 
 * // Using URI
 * const faces = await detectFacesInImage({
 *   image: { uri: 'https://example.com/photo.jpg' },
 *   classificationMode: 'all',
 * });
 * ```
 */
export async function detectFacesInImage(options: StaticImageOptions): Promise<Face[]> {
  const mergedOptions: StaticImageOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {
    return await SmartCameraModule.detectFacesInImage(mergedOptions);
  } catch (error) {
    console.error('[SmartCamera] Error detecting faces in image:', error);
    throw error;
  }
}

