/**
 * useWebRTC Hook
 * 
 * React hook for managing WebRTC video calling with peer connections,
 * local/remote streams, and signaling integration.
 * 
 * This hook provides all the functionality needed for 1-to-1 video calls.
 * Users are responsible for implementing their own signaling mechanism
 * (WebSocket, Socket.io, etc.) to exchange SDP offers/answers and ICE candidates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  WebRTCManager,
  isWebRTCAvailable,
} from '../webrtc/WebRTCManager';
import type {
  UseWebRTCOptions,
  UseWebRTCResult,
  PeerConnectionConfig,
  MediaConstraints,
  SessionDescription,
  ICECandidateEvent,
  CallState,
  WebRTCConnectionState,
  ICEConnectionState,
} from '../webrtc/types';

/**
 * Hook for WebRTC video calling
 * 
 * @param options - Configuration options
 * @returns WebRTC controls and state
 * 
 * @example
 * ```tsx
 * import { useWebRTC } from '@arfuhad/react-native-smart-camera';
 * import { RTCView } from 'react-native-webrtc';
 * 
 * function VideoCall() {
 *   const {
 *     localStream,
 *     remoteStream,
 *     callState,
 *     startLocalStream,
 *     createPeerConnection,
 *     createOffer,
 *     setRemoteDescription,
 *     addIceCandidate,
 *     onIceCandidate,
 *     switchCamera,
 *     toggleAudio,
 *     toggleVideo,
 *     cleanup,
 *   } = useWebRTC({
 *     config: {
 *       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
 *     },
 *     onRemoteStream: (stream) => console.log('Remote stream received'),
 *   });
 * 
 *   // Start a call
 *   const startCall = async () => {
 *     await startLocalStream();
 *     createPeerConnection();
 *     const offer = await createOffer();
 *     // Send offer via your signaling server
 *     socket.emit('offer', offer);
 *   };
 * 
 *   // Handle incoming call
 *   useEffect(() => {
 *     socket.on('offer', async (offer) => {
 *       await startLocalStream();
 *       createPeerConnection();
 *       await setRemoteDescription(offer);
 *       const answer = await createAnswer();
 *       socket.emit('answer', answer);
 *     });
 * 
 *     socket.on('ice-candidate', (candidate) => {
 *       addIceCandidate(candidate);
 *     });
 * 
 *     onIceCandidate((event) => {
 *       if (event.candidate) {
 *         socket.emit('ice-candidate', event.candidate);
 *       }
 *     });
 *   }, []);
 * 
 *   return (
 *     <View>
 *       {remoteStream && <RTCView streamURL={remoteStream.toURL()} />}
 *       {localStream && <RTCView streamURL={localStream.toURL()} />}
 *       <Button onPress={switchCamera} title="Switch Camera" />
 *       <Button onPress={toggleAudio} title="Mute/Unmute" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCResult {
  const {
    config,
    mediaConstraints,
    initialCamera = 'front',
    autoStartLocalStream = false,
    onCallStateChange,
    onConnectionStateChange,
    onIceConnectionStateChange,
    onRemoteStream,
    onRemoteStreamRemoved,
    onError,
  } = options;

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentCamera, setCurrentCamera] = useState<'front' | 'back'>(initialCamera);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  // Refs
  const managerRef = useRef<WebRTCManager | null>(null);
  const isMountedRef = useRef(true);
  const iceCandidateCallbackRef = useRef<((event: ICECandidateEvent) => void) | null>(null);
  const callbacksRef = useRef({
    onCallStateChange,
    onConnectionStateChange,
    onIceConnectionStateChange,
    onRemoteStream,
    onRemoteStreamRemoved,
    onError,
  });

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = {
      onCallStateChange,
      onConnectionStateChange,
      onIceConnectionStateChange,
      onRemoteStream,
      onRemoteStreamRemoved,
      onError,
    };
  }, [
    onCallStateChange,
    onConnectionStateChange,
    onIceConnectionStateChange,
    onRemoteStream,
    onRemoteStreamRemoved,
    onError,
  ]);

  // Initialize manager
  useEffect(() => {
    if (!isWebRTCAvailable()) {
      console.warn('[useWebRTC] react-native-webrtc is not available');
      return;
    }

    managerRef.current = new WebRTCManager(config);

    return () => {
      isMountedRef.current = false;
      managerRef.current?.cleanup();
    };
  }, []);

  // Auto-start local stream if configured
  useEffect(() => {
    if (autoStartLocalStream && isWebRTCAvailable()) {
      startLocalStream();
    }
  }, [autoStartLocalStream]);

  // Update call state and notify
  const updateCallState = useCallback((newState: CallState) => {
    if (isMountedRef.current) {
      setCallState(newState);
      callbacksRef.current.onCallStateChange?.(newState);
    }
  }, []);

  // ==========================================================================
  // Local Stream Controls
  // ==========================================================================

  /**
   * Start local camera/microphone stream
   */
  const startLocalStream = useCallback(async (): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }

    try {
      const constraints: MediaConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: currentCamera === 'front' ? 'user' : 'environment',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        ...mediaConstraints,
      };

      const stream = await managerRef.current.getLocalStream(constraints);
      
      if (isMountedRef.current) {
        setLocalStream(stream);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);
      }
    } catch (error) {
      callbacksRef.current.onError?.(error as Error);
      throw error;
    }
  }, [currentCamera, mediaConstraints]);

  /**
   * Stop local stream
   */
  const stopLocalStream = useCallback((): void => {
    managerRef.current?.stopLocalStream();
    if (isMountedRef.current) {
      setLocalStream(null);
    }
  }, []);

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async (): Promise<void> => {
    try {
      await managerRef.current?.switchCamera();
      if (isMountedRef.current) {
        setCurrentCamera((prev) => (prev === 'front' ? 'back' : 'front'));
      }
    } catch (error) {
      callbacksRef.current.onError?.(error as Error);
      throw error;
    }
  }, []);

  /**
   * Toggle local audio on/off
   */
  const toggleAudio = useCallback((): void => {
    const newState = !isAudioEnabled;
    managerRef.current?.toggleAudio(newState);
    if (isMountedRef.current) {
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);

  /**
   * Toggle local video on/off
   */
  const toggleVideo = useCallback((): void => {
    const newState = !isVideoEnabled;
    managerRef.current?.toggleVideo(newState);
    if (isMountedRef.current) {
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);

  // ==========================================================================
  // Peer Connection Management
  // ==========================================================================

  /**
   * Create a new peer connection
   */
  const createPeerConnection = useCallback((pcConfig?: PeerConnectionConfig): RTCPeerConnection => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }

    const pc = managerRef.current.createPeerConnection(pcConfig || config);

    // Setup callbacks
    managerRef.current.onRemoteStream((stream) => {
      if (isMountedRef.current) {
        setRemoteStream(stream);
        updateCallState('connected');
        callbacksRef.current.onRemoteStream?.(stream);
      }
    });

    managerRef.current.onConnectionStateChange((state) => {
      callbacksRef.current.onConnectionStateChange?.(state);
      
      // Update call state based on connection state
      if (state === 'connected') {
        updateCallState('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        updateCallState('disconnected');
      } else if (state === 'connecting') {
        updateCallState('connecting');
      }
    });

    managerRef.current.onIceConnectionStateChange((state) => {
      callbacksRef.current.onIceConnectionStateChange?.(state);
    });

    managerRef.current.onIceCandidate((event) => {
      iceCandidateCallbackRef.current?.(event);
    });

    // Add local stream to peer connection if available
    const stream = managerRef.current.getLocalStreamInstance();
    if (stream) {
      managerRef.current.addLocalStream(stream);
    }

    if (isMountedRef.current) {
      setPeerConnection(pc);
      updateCallState('connecting');
    }

    return pc;
  }, [config, updateCallState]);

  /**
   * Close the peer connection
   */
  const closePeerConnection = useCallback((): void => {
    managerRef.current?.closePeerConnection();
    if (isMountedRef.current) {
      setPeerConnection(null);
      setRemoteStream(null);
      updateCallState('idle');
      callbacksRef.current.onRemoteStreamRemoved?.();
    }
  }, [updateCallState]);

  // ==========================================================================
  // Signaling Helpers
  // ==========================================================================

  /**
   * Create an SDP offer
   */
  const createOffer = useCallback(async (): Promise<SessionDescription> => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }
    return managerRef.current.createOffer();
  }, []);

  /**
   * Create an SDP answer
   */
  const createAnswer = useCallback(async (): Promise<SessionDescription> => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }
    return managerRef.current.createAnswer();
  }, []);

  /**
   * Set the remote SDP description
   */
  const setRemoteDescription = useCallback(async (description: SessionDescription): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }
    await managerRef.current.setRemoteDescription(description);
  }, []);

  /**
   * Add an ICE candidate from remote peer
   */
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('WebRTC not initialized');
    }
    await managerRef.current.addIceCandidate(candidate);
  }, []);

  /**
   * Register callback for ICE candidates
   */
  const onIceCandidate = useCallback((callback: (event: ICECandidateEvent) => void): void => {
    iceCandidateCallbackRef.current = callback;
  }, []);

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Clean up all resources
   */
  const cleanup = useCallback((): void => {
    managerRef.current?.cleanup();
    if (isMountedRef.current) {
      setLocalStream(null);
      setRemoteStream(null);
      setPeerConnection(null);
      setCallState('idle');
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
    }
  }, []);

  return {
    // Streams
    localStream,
    remoteStream,
    
    // State
    callState,
    isAudioEnabled,
    isVideoEnabled,
    currentCamera,
    peerConnection,
    
    // Local stream controls
    startLocalStream,
    stopLocalStream,
    switchCamera,
    toggleAudio,
    toggleVideo,
    
    // Peer connection management
    createPeerConnection,
    closePeerConnection,
    
    // Signaling helpers
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    onIceCandidate,
    
    // Cleanup
    cleanup,
  };
}

export type { UseWebRTCOptions, UseWebRTCResult };

