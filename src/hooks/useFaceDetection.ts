import { useState, useCallback, useRef, useEffect } from 'react';
import type { Face, FaceDetectionOptions, UseFaceDetectionResult } from '../types';

/**
 * Options for useFaceDetection hook
 */
export interface UseFaceDetectionOptions extends FaceDetectionOptions {
  /** Whether detection is enabled. Default: true */
  enabled?: boolean;
  
  /** Maximum number of faces to track. Default: 5 */
  maxFaces?: number;
  
  /** Callback when faces change */
  onFacesChanged?: (faces: Face[]) => void;
}

/**
 * Hook for managing face detection state
 * 
 * Use this hook to get face detection results outside of the SmartCamera component.
 * 
 * @param options - Face detection options
 * @returns Face detection state
 * 
 * @example
 * ```tsx
 * function FaceTracker() {
 *   const { faces, isDetecting } = useFaceDetection({
 *     performanceMode: 'fast',
 *     classificationMode: 'all',
 *     onFacesChanged: (faces) => {
 *       console.log('Detected faces:', faces.length);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <Text>Faces detected: {faces.length}</Text>
 *       {faces.map((face, i) => (
 *         <Text key={i}>
 *           Smiling: {(face.smilingProbability ?? 0) * 100}%
 *         </Text>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useFaceDetection(options: UseFaceDetectionOptions = {}): UseFaceDetectionResult {
  const { enabled = true, maxFaces = 5, onFacesChanged } = options;
  
  const [faces, setFaces] = useState<Face[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const facesRef = useRef<Face[]>([]);
  const callbackRef = useRef(onFacesChanged);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onFacesChanged;
  }, [onFacesChanged]);

  // Update faces (called from frame processor via native bridge)
  const updateFaces = useCallback((newFaces: Face[]) => {
    // Limit number of faces
    const limitedFaces = newFaces.slice(0, maxFaces);
    
    // Only update if faces changed
    const facesChanged = 
      limitedFaces.length !== facesRef.current.length ||
      limitedFaces.some((face, i) => face.trackingId !== facesRef.current[i]?.trackingId);
    
    if (facesChanged) {
      facesRef.current = limitedFaces;
      setFaces(limitedFaces);
      callbackRef.current?.(limitedFaces);
    }
  }, [maxFaces]);

  // Detection state management
  const startDetecting = useCallback(() => {
    setIsDetecting(true);
  }, []);

  const stopDetecting = useCallback(() => {
    setIsDetecting(false);
    setFaces([]);
    facesRef.current = [];
  }, []);

  // Effect to manage detection state based on enabled prop
  useEffect(() => {
    if (enabled) {
      startDetecting();
    } else {
      stopDetecting();
    }
  }, [enabled, startDetecting, stopDetecting]);

  return {
    faces,
    isDetecting,
  };
}

