// WebRTC Manager
export {
  WebRTCManager,
  getWebRTCManager,
  createWebRTCManager,
  isWebRTCAvailable,
} from './WebRTCManager';

// Legacy Bridge (deprecated, use WebRTCManager instead)
export { WebRTCBridge, getWebRTCBridge } from './WebRTCBridge';

// Types
export type {
  // Core types
  ICEServer,
  PeerConnectionConfig,
  VideoConstraints,
  AudioConstraints,
  MediaConstraints,
  
  // State types
  CallState,
  WebRTCConnectionState,
  ICEConnectionState,
  ICEGatheringState,
  SignalingState,
  
  // Stream types
  VideoFrameFormat,
  WebRTCVideoSourceConfig,
  WebRTCStreamStats,
  WebRTCQualitySettings,
  
  // Event types
  WebRTCStreamEvent,
  ICECandidateEvent,
  SessionDescription,
  
  // Hook types
  UseWebRTCOptions,
  UseWebRTCResult,
  UseWebRTCWithDetectionOptions,
} from './types';

// Default configurations
export {
  DEFAULT_ICE_SERVERS,
  DEFAULT_PEER_CONNECTION_CONFIG,
  DEFAULT_MEDIA_CONSTRAINTS,
} from './types';
