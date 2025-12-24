/**
 * useWebRTCWithDetection Hook
 * 
 * Combined hook that provides WebRTC video calling functionality
 * alongside face detection and eye tracking capabilities.
 * 
 * This hook allows you to:
 * - Make video calls using WebRTC
 * - Detect faces in the local camera feed using VisionCamera
 * - Track eye status for blink detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRunOnJS } from 'react-native-worklets-core';
import type { Frame } from 'react-native-vision-camera';
import { useWebRTC } from './useWebRTC';
import { useFaceDetector } from './useFaceDetector';
import { useBlinkDetection } from './useBlinkDetection';
import type { Face, EyeStatusResult } from '../types';
import type {
  UseWebRTCOptions,
  UseWebRTCResult,
  UseWebRTCWithDetectionOptions,
} from '../webrtc/types';

// Re-export the options type
export type { UseWebRTCWithDetectionOptions } from '../webrtc/types';

/**
 * Result type for useWebRTCWithDetection hook
 */
export interface UseWebRTCWithDetectionResult extends UseWebRTCResult {
  // Face detection
  /** Currently detected faces */
  faces: Face[];
  /** Detect faces in a frame (for use in VisionCamera frame processor) */
  detectFaces: (frame: Frame) => Face[];
  
  // Eye tracking
  /** Current eye status */
  eyeStatus: EyeStatusResult | null;
  /** Process faces for eye tracking */
  processEyeStatus: (faces: Face[]) => void;
  /** Reset eye status */
  resetEyeStatus: () => void;
  
  // Combined handler for frame processor
  /** Process a frame for both face detection and eye tracking */
  processFrame: (frame: Frame) => void;
}

/**
 * Hook combining WebRTC video calling with face detection and eye tracking
 * 
 * @param options - Configuration options
 * @returns Combined WebRTC, face detection, and eye tracking controls
 * 
 * @example
 * ```tsx
 * import { useWebRTCWithDetection } from '@arfuhad/react-native-smart-camera';
 * import { Camera, useFrameProcessor } from 'react-native-vision-camera';
 * import { RTCView } from 'react-native-webrtc';
 * 
 * function VideoCallWithDetection() {
 *   const {
 *     // WebRTC
 *     localStream,
 *     remoteStream,
 *     callState,
 *     startLocalStream,
 *     createPeerConnection,
 *     // Face detection
 *     faces,
 *     detectFaces,
 *     // Eye tracking
 *     eyeStatus,
 *     // Combined handler
 *     processFrame,
 *   } = useWebRTCWithDetection({
 *     config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
 *     faceDetection: { enabled: true, classificationMode: 'all' },
 *     eyeTracking: { enabled: true, eyeClosedThreshold: 0.3 },
 *   });
 * 
 *   // Use VisionCamera for local preview + detection
 *   // Use RTCView for remote stream
 *   const frameProcessor = useFrameProcessor((frame) => {
 *     'worklet';
 *     processFrame(frame);
 *   }, [processFrame]);
 * 
 *   return (
 *     <View>
 *       <Camera
 *         device={device}
 *         isActive={true}
 *         frameProcessor={frameProcessor}
 *       />
 *       {remoteStream && <RTCView streamURL={remoteStream.toURL()} />}
 *       <Text>Faces: {faces.length}</Text>
 *       <Text>Left Eye: {eyeStatus?.leftEye.openProbability.toFixed(2)}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useWebRTCWithDetection(
  options: UseWebRTCWithDetectionOptions = {}
): UseWebRTCWithDetectionResult {
  const {
    faceDetection = {},
    eyeTracking = {},
    ...webrtcOptions
  } = options;

  // WebRTC hook
  const webrtc = useWebRTC(webrtcOptions);

  // Face detection state
  const [faces, setFaces] = useState<Face[]>([]);

  // Face detector hook
  const { detectFaces } = useFaceDetector({
    performanceMode: faceDetection.performanceMode || 'fast',
    landmarkMode: faceDetection.landmarkMode || 'none',
    classificationMode: faceDetection.classificationMode || 'all', // Needed for eye tracking
    trackingEnabled: true,
  });

  // Blink detection hook
  const {
    eyeStatus,
    processEyeStatus,
    reset: resetEyeStatus,
  } = useBlinkDetection({
    enabled: eyeTracking.enabled !== false,
    eyeClosedThreshold: eyeTracking.eyeClosedThreshold ?? 0.5,
  });

  // Handle detected faces on JS thread
  const handleFaces = useRunOnJS((detectedFaces: Face[]) => {
    setFaces(detectedFaces);
    
    // Process for eye tracking if enabled
    if (eyeTracking.enabled !== false) {
      processEyeStatus(detectedFaces);
    }
  }, [processEyeStatus, eyeTracking.enabled]);

  // Combined frame processor function
  const processFrame = useCallback((frame: Frame) => {
    'worklet';
    
    if (faceDetection.enabled === false) {
      return;
    }
    
    const detectedFaces = detectFaces(frame);
    handleFaces(detectedFaces);
  }, [detectFaces, handleFaces, faceDetection.enabled]);

  return {
    // WebRTC
    ...webrtc,
    
    // Face detection
    faces,
    detectFaces,
    
    // Eye tracking
    eyeStatus,
    processEyeStatus,
    resetEyeStatus,
    
    // Combined handler
    processFrame,
  };
}

// Types are exported from the interface definition above

