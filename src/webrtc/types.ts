/**
 * WebRTC-related types for the SmartCamera module
 */

// =============================================================================
// Core WebRTC Types
// =============================================================================

/**
 * ICE server configuration for STUN/TURN servers
 */
export interface ICEServer {
  /** STUN/TURN server URLs */
  urls: string | string[];
  /** Username for TURN authentication */
  username?: string;
  /** Credential for TURN authentication */
  credential?: string;
}

/**
 * Peer connection configuration
 */
export interface PeerConnectionConfig {
  /** ICE servers (STUN/TURN) */
  iceServers?: ICEServer[];
  /** ICE transport policy */
  iceTransportPolicy?: 'all' | 'relay';
  /** Bundle policy */
  bundlePolicy?: 'balanced' | 'max-bundle' | 'max-compat';
  /** RTCP mux policy */
  rtcpMuxPolicy?: 'require';
}

/**
 * Video constraints for getUserMedia
 */
export interface VideoConstraints {
  /** Frame width in pixels */
  width?: number | { min?: number; ideal?: number; max?: number };
  /** Frame height in pixels */
  height?: number | { min?: number; ideal?: number; max?: number };
  /** Target frame rate */
  frameRate?: number | { min?: number; ideal?: number; max?: number };
  /** Camera facing mode */
  facingMode?: 'user' | 'environment';
}

/**
 * Audio constraints for getUserMedia
 */
export interface AudioConstraints {
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable auto gain control */
  autoGainControl?: boolean;
}

/**
 * Media stream constraints
 */
export interface MediaConstraints {
  /** Video constraints (false to disable video) */
  video?: boolean | VideoConstraints;
  /** Audio constraints (false to disable audio) */
  audio?: boolean | AudioConstraints;
}

// =============================================================================
// Call State Types
// =============================================================================

/**
 * WebRTC call state
 */
export type CallState =
  | 'idle'        // No active call
  | 'connecting'  // Call is being established
  | 'connected'   // Call is active
  | 'reconnecting'// Connection lost, attempting to reconnect
  | 'disconnected'// Call ended or failed
  | 'failed';     // Call failed to establish

/**
 * WebRTC connection state (maps to RTCPeerConnectionState)
 */
export type WebRTCConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

/**
 * ICE connection state
 */
export type ICEConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

/**
 * ICE gathering state
 */
export type ICEGatheringState = 'new' | 'gathering' | 'complete';

/**
 * Signaling state
 */
export type SignalingState =
  | 'stable'
  | 'have-local-offer'
  | 'have-remote-offer'
  | 'have-local-pranswer'
  | 'have-remote-pranswer'
  | 'closed';

// =============================================================================
// Stream and Track Types
// =============================================================================

/**
 * Video frame format for WebRTC
 */
export type VideoFrameFormat = 'I420' | 'NV12' | 'NV21' | 'BGRA';

/**
 * Configuration for the WebRTC video source
 */
export interface WebRTCVideoSourceConfig {
  /** Frame width in pixels */
  width: number;
  /** Frame height in pixels */
  height: number;
  /** Target frame rate */
  frameRate: number;
  /** Video frame format. Default: 'I420' */
  format?: VideoFrameFormat;
}

/**
 * WebRTC stream statistics
 */
export interface WebRTCStreamStats {
  /** Current frame rate */
  frameRate: number;
  /** Frames sent */
  framesSent: number;
  /** Frames dropped */
  framesDropped: number;
  /** Bytes sent */
  bytesSent: number;
  /** Current bitrate in bps */
  bitrate: number;
  /** Round-trip time in ms */
  rtt?: number;
  /** Packets lost */
  packetsLost?: number;
  /** Jitter in ms */
  jitter?: number;
}

/**
 * WebRTC stream quality settings
 */
export interface WebRTCQualitySettings {
  /** Maximum bitrate in bps */
  maxBitrate?: number;
  /** Minimum bitrate in bps */
  minBitrate?: number;
  /** Target frame rate */
  targetFrameRate?: number;
  /** Resolution scale (0.0 - 1.0) */
  resolutionScale?: number;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Event emitted when WebRTC stream state changes
 */
export interface WebRTCStreamEvent {
  type: 'started' | 'stopped' | 'error' | 'stats';
  timestamp: number;
  error?: Error;
  stats?: WebRTCStreamStats;
}

/**
 * ICE candidate event data
 */
export interface ICECandidateEvent {
  /** The ICE candidate */
  candidate: RTCIceCandidate | null;
  /** SDP mid */
  sdpMid?: string | null;
  /** SDP m-line index */
  sdpMLineIndex?: number | null;
}

/**
 * Session description for signaling
 */
export interface SessionDescription {
  /** Type of description (offer/answer) */
  type: 'offer' | 'answer';
  /** SDP string */
  sdp: string;
}

// =============================================================================
// Hook Options and Results
// =============================================================================

/**
 * Options for useWebRTC hook
 */
export interface UseWebRTCOptions {
  /** Peer connection configuration */
  config?: PeerConnectionConfig;
  /** Media constraints for local stream */
  mediaConstraints?: MediaConstraints;
  /** Initial camera facing mode */
  initialCamera?: 'front' | 'back';
  /** Auto-start local stream when hook mounts */
  autoStartLocalStream?: boolean;
  /** Callback when call state changes */
  onCallStateChange?: (state: CallState) => void;
  /** Callback when connection state changes */
  onConnectionStateChange?: (state: WebRTCConnectionState) => void;
  /** Callback when ICE connection state changes */
  onIceConnectionStateChange?: (state: ICEConnectionState) => void;
  /** Callback when remote stream is received */
  onRemoteStream?: (stream: MediaStream) => void;
  /** Callback when remote stream is removed */
  onRemoteStreamRemoved?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Result type for useWebRTC hook
 */
export interface UseWebRTCResult {
  // Streams
  /** Local media stream (camera + microphone) */
  localStream: MediaStream | null;
  /** Remote media stream from peer */
  remoteStream: MediaStream | null;
  
  // State
  /** Current call state */
  callState: CallState;
  /** Whether local audio is enabled */
  isAudioEnabled: boolean;
  /** Whether local video is enabled */
  isVideoEnabled: boolean;
  /** Current camera facing mode */
  currentCamera: 'front' | 'back';
  /** Peer connection instance */
  peerConnection: RTCPeerConnection | null;
  
  // Local stream controls
  /** Start local camera/microphone stream */
  startLocalStream: () => Promise<void>;
  /** Stop local stream */
  stopLocalStream: () => void;
  /** Switch between front and back camera */
  switchCamera: () => Promise<void>;
  /** Toggle local audio on/off */
  toggleAudio: () => void;
  /** Toggle local video on/off */
  toggleVideo: () => void;
  
  // Peer connection management
  /** Create a new peer connection */
  createPeerConnection: (config?: PeerConnectionConfig) => RTCPeerConnection;
  /** Close the peer connection */
  closePeerConnection: () => void;
  
  // Signaling helpers (user integrates with their signaling server)
  /** Create an SDP offer */
  createOffer: () => Promise<SessionDescription>;
  /** Create an SDP answer */
  createAnswer: () => Promise<SessionDescription>;
  /** Set the remote SDP description */
  setRemoteDescription: (description: SessionDescription) => Promise<void>;
  /** Add an ICE candidate from remote peer */
  addIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
  /** Register callback for ICE candidates to send to remote peer */
  onIceCandidate: (callback: (candidate: ICECandidateEvent) => void) => void;
  
  // Cleanup
  /** Clean up all resources */
  cleanup: () => void;
}

/**
 * Options for useWebRTCWithDetection hook
 */
export interface UseWebRTCWithDetectionOptions extends UseWebRTCOptions {
  /** Face detection options */
  faceDetection?: {
    enabled?: boolean;
    performanceMode?: 'fast' | 'accurate';
    landmarkMode?: 'none' | 'all';
    classificationMode?: 'none' | 'all';
  };
  /** Eye tracking options */
  eyeTracking?: {
    enabled?: boolean;
    eyeClosedThreshold?: number;
  };
}

// =============================================================================
// Default Configurations
// =============================================================================

/**
 * Default ICE servers (Google STUN servers)
 */
export const DEFAULT_ICE_SERVERS: ICEServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Default peer connection configuration
 */
export const DEFAULT_PEER_CONNECTION_CONFIG: PeerConnectionConfig = {
  iceServers: DEFAULT_ICE_SERVERS,
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
};

/**
 * Default media constraints
 */
export const DEFAULT_MEDIA_CONSTRAINTS: MediaConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};
