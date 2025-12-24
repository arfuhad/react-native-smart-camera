import { useState, useCallback, useRef, useEffect } from 'react';
import type { Face, EyeStatusResult, UseBlinkDetectionResult } from '../types';

/**
 * Options for useBlinkDetection hook
 */
export interface UseBlinkDetectionOptions {
  /** Whether eye tracking is enabled. Default: true */
  enabled?: boolean;
  
  /** Threshold below which an eye is considered closed (0-1). Default: 0.5 */
  eyeClosedThreshold?: number;
  
  /** Callback when eye status changes */
  onEyeStatusChange?: (status: EyeStatusResult) => void;
}

/**
 * Hook for tracking eye status from detected faces
 * 
 * This hook provides real-time eye open/closed status based on face detection results.
 * The user can set their own threshold for determining when an eye is considered closed.
 * 
 * @param options - Eye tracking options
 * @returns Eye status and controls
 * 
 * @example
 * ```tsx
 * function EyeTracker() {
 *   const { eyeStatus, processEyeStatus } = useBlinkDetection({
 *     eyeClosedThreshold: 0.3, // Consider eye closed when probability < 0.3
 *     onEyeStatusChange: (status) => {
 *       // Handle blink detection yourself based on status
 *       if (status.leftEye.isClosed && status.rightEye.isClosed) {
 *         console.log('Both eyes closed!');
 *       }
 *     },
 *   });
 *   
 *   // In your face detection callback:
 *   const handleFaces = (faces: Face[]) => {
 *     processEyeStatus(faces);
 *   };
 *   
 *   return (
 *     <View>
 *       <Text>Left Eye: {eyeStatus?.leftEye.openProbability.toFixed(2)}</Text>
 *       <Text>Right Eye: {eyeStatus?.rightEye.openProbability.toFixed(2)}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useBlinkDetection(
  options: UseBlinkDetectionOptions = {}
): UseBlinkDetectionResult {
  const { 
    enabled = true, 
    eyeClosedThreshold = 0.5, 
    onEyeStatusChange 
  } = options;
  
  const [eyeStatus, setEyeStatus] = useState<EyeStatusResult | null>(null);
  const callbackRef = useRef(onEyeStatusChange);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onEyeStatusChange;
  }, [onEyeStatusChange]);

  // Process faces to get eye status (call this from JS thread with detected faces)
  const processEyeStatus = useCallback((faces: Face[]) => {
    if (!enabled || faces.length === 0) {
      return;
    }

    // Use the first face (most prominent)
    const face = faces[0];

    // Ensure we have eye classification data
    if (
      face.leftEyeOpenProbability === undefined ||
      face.rightEyeOpenProbability === undefined
    ) {
      return;
    }

    const leftOpenProbability = face.leftEyeOpenProbability;
    const rightOpenProbability = face.rightEyeOpenProbability;
    const now = Date.now();

    const status: EyeStatusResult = {
      leftEye: {
        openProbability: leftOpenProbability,
        isClosed: leftOpenProbability < eyeClosedThreshold,
      },
      rightEye: {
        openProbability: rightOpenProbability,
        isClosed: rightOpenProbability < eyeClosedThreshold,
      },
      faceId: face.trackingId,
      timestamp: now,
    };

    setEyeStatus(status);
    callbackRef.current?.(status);
  }, [enabled, eyeClosedThreshold]);

  // Reset eye status
  const reset = useCallback(() => {
    setEyeStatus(null);
  }, []);

  // Reset on disable
  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  return {
    eyeStatus,
    processEyeStatus,
    reset,
  };
}

