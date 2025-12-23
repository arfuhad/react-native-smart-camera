/**
 * WebRTC-related types for the SmartCamera module
 */

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
 * WebRTC connection state
 */
export type WebRTCConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

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

/**
 * Event emitted when WebRTC stream state changes
 */
export interface WebRTCStreamEvent {
  type: 'started' | 'stopped' | 'error' | 'stats';
  timestamp: number;
  error?: Error;
  stats?: WebRTCStreamStats;
}

