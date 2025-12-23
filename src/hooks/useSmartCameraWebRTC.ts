import { useState, useCallback, useRef, useEffect } from 'react';
import type { WebRTCConfig, UseSmartCameraWebRTCResult, CameraFacing } from '../types';
import {
  initializeWebRTC,
  startWebRTCStream,
  stopWebRTCStream,
  addWebRTCStateChangeListener,
} from '../SmartCameraModule';

/**
 * Options for useSmartCameraWebRTC hook
 */
export interface UseSmartCameraWebRTCOptions extends Omit<WebRTCConfig, 'enabled'> {
  /** Initial camera facing. Default: 'front' */
  initialCamera?: CameraFacing;
  
  /** Callback when streaming state changes */
  onStreamingStateChange?: (isStreaming: boolean) => void;
  
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing WebRTC streaming with SmartCamera
 * 
 * This hook provides control over WebRTC video streaming, allowing you to
 * start/stop streaming and switch cameras while streaming.
 * 
 * @param options - WebRTC configuration options
 * @returns WebRTC streaming controls and state
 * 
 * @example
 * ```tsx
 * function VideoCall() {
 *   const peerConnection = useRef(new RTCPeerConnection(config)).current;
 *   
 *   const {
 *     videoTrack,
 *     isStreaming,
 *     startStreaming,
 *     stopStreaming,
 *     switchCamera,
 *   } = useSmartCameraWebRTC({
 *     peerConnection,
 *     mode: 'call',
 *     videoConstraints: {
 *       width: 1280,
 *       height: 720,
 *       frameRate: 30,
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <SmartCamera 
 *         webrtc={{ enabled: isStreaming, peerConnection, mode: 'call' }}
 *       />
 *       <Button 
 *         onPress={isStreaming ? stopStreaming : startStreaming} 
 *         title={isStreaming ? 'End Call' : 'Start Call'} 
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useSmartCameraWebRTC(
  options: UseSmartCameraWebRTCOptions = {}
): UseSmartCameraWebRTCResult {
  const {
    peerConnection,
    mode = 'call',
    videoConstraints = { width: 1280, height: 720, frameRate: 30 },
    initialCamera = 'front',
    onStreamingStateChange,
    onError,
  } = options;

  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<CameraFacing>(initialCamera);
  
  const peerConnectionRef = useRef(peerConnection);
  const callbacksRef = useRef({ onStreamingStateChange, onError });
  const isMounted = useRef(true);

  // Keep refs updated
  useEffect(() => {
    peerConnectionRef.current = peerConnection;
    callbacksRef.current = { onStreamingStateChange, onError };
  }, [peerConnection, onStreamingStateChange, onError]);

  // Track mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Subscribe to WebRTC state changes
  useEffect(() => {
    const subscription = addWebRTCStateChangeListener((state) => {
      if (isMounted.current) {
        setIsStreaming(state.isStreaming);
        callbacksRef.current.onStreamingStateChange?.(state.isStreaming);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize WebRTC on first use
  const ensureInitialized = useCallback(async (): Promise<void> => {
    if (isInitialized) return;

    try {
      await initializeWebRTC();
      if (isMounted.current) {
        setIsInitialized(true);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacksRef.current.onError?.(err);
      throw err;
    }
  }, [isInitialized]);

  // Start streaming
  const startStreaming = useCallback(async (): Promise<void> => {
    try {
      // Ensure WebRTC is initialized
      await ensureInitialized();

      // Start the WebRTC stream with video constraints
      await startWebRTCStream({
        width: videoConstraints.width ?? 1280,
        height: videoConstraints.height ?? 720,
        frameRate: videoConstraints.frameRate ?? 30,
      });

      if (isMounted.current) {
        setIsStreaming(true);
        callbacksRef.current.onStreamingStateChange?.(true);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacksRef.current.onError?.(err);
      throw err;
    }
  }, [videoConstraints, ensureInitialized]);

  // Stop streaming
  const stopStreaming = useCallback((): void => {
    try {
      stopWebRTCStream();
      if (isMounted.current) {
        setVideoTrack(null);
        setIsStreaming(false);
        callbacksRef.current.onStreamingStateChange?.(false);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacksRef.current.onError?.(err);
    }
  }, []);

  // Switch camera while streaming
  const switchCamera = useCallback((): void => {
    setCurrentCamera((prev) => (prev === 'front' ? 'back' : 'front'));
    // The camera switch will be handled by the SmartCamera component
    // when the camera prop changes
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        try {
          stopWebRTCStream();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [isStreaming]);

  return {
    videoTrack,
    isStreaming,
    startStreaming,
    stopStreaming,
    switchCamera,
  };
}
