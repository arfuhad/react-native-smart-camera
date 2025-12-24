import type {
  WebRTCVideoSourceConfig,
  WebRTCStreamStats,
  WebRTCQualitySettings,
} from './types';

/**
 * WebRTC Bridge for SmartCamera
 * 
 * NOTE: This is a stub implementation. WebRTC functionality is not yet implemented.
 * This class provides the interface for future WebRTC integration.
 * 
 * This class provides a bridge between VisionCamera frames and WebRTC,
 * allowing camera frames to be streamed via WebRTC peer connections.
 */
export class WebRTCBridge {
  private isInitialized = false;
  private isStreaming = false;
  private config: WebRTCVideoSourceConfig | null = null;

  /**
   * Initialize the WebRTC bridge
   * 
   * This must be called before starting streaming.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.warn('[WebRTCBridge] WebRTC is not yet implemented');
    this.isInitialized = true;
  }

  /**
   * Start streaming camera frames via WebRTC
   * 
   * @param config - Video source configuration
   */
  async startStreaming(config: WebRTCVideoSourceConfig): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isStreaming) {
      console.warn('[WebRTCBridge] Already streaming, stopping first');
      await this.stopStreaming();
    }

    console.warn('[WebRTCBridge] WebRTC streaming is not yet implemented');
    this.config = config;
    this.isStreaming = true;
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    this.isStreaming = false;
    this.config = null;
  }

  /**
   * Check if currently streaming
   */
  getIsStreaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Get current configuration
   */
  getConfig(): WebRTCVideoSourceConfig | null {
    return this.config;
  }

  /**
   * Update quality settings (if supported)
   * 
   * @param settings - Quality settings to apply
   */
  async updateQuality(settings: WebRTCQualitySettings): Promise<void> {
    console.log('[WebRTCBridge] Updating quality:', settings);
  }

  /**
   * Get current stream statistics
   */
  async getStats(): Promise<WebRTCStreamStats | null> {
    if (!this.isStreaming) {
      return null;
    }

    return {
      frameRate: this.config?.frameRate ?? 0,
      framesSent: 0,
      framesDropped: 0,
      bytesSent: 0,
      bitrate: 0,
    };
  }

  /**
   * Cleanup and release resources
   */
  async destroy(): Promise<void> {
    await this.stopStreaming();
    this.isInitialized = false;
  }
}

// Singleton instance for convenience
let bridgeInstance: WebRTCBridge | null = null;

/**
 * Get the shared WebRTC bridge instance
 */
export function getWebRTCBridge(): WebRTCBridge {
  if (!bridgeInstance) {
    bridgeInstance = new WebRTCBridge();
  }
  return bridgeInstance;
}
