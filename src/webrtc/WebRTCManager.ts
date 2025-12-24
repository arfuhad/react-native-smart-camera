/**
 * WebRTC Manager for SmartCamera
 * 
 * This class provides utilities for managing WebRTC peer connections,
 * media streams, and video calling functionality.
 * 
 * Requires react-native-webrtc to be installed in the app.
 */

import type {
  PeerConnectionConfig,
  MediaConstraints,
  SessionDescription,
  ICECandidateEvent,
  WebRTCConnectionState,
  ICEConnectionState,
  CallState,
  DEFAULT_PEER_CONNECTION_CONFIG,
  DEFAULT_MEDIA_CONSTRAINTS,
} from './types';

// Import from react-native-webrtc (peer dependency)
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let mediaDevices: any;

// Lazy load react-native-webrtc to avoid errors when not installed
function loadWebRTC(): boolean {
  if (RTCPeerConnection) return true;
  
  try {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    mediaDevices = webrtc.mediaDevices;
    return true;
  } catch (error) {
    console.error(
      '[WebRTCManager] react-native-webrtc is not installed. ' +
      'Please install it: npm install react-native-webrtc'
    );
    return false;
  }
}

/**
 * Check if WebRTC is available
 */
export function isWebRTCAvailable(): boolean {
  return loadWebRTC();
}

/**
 * WebRTC Manager class for handling peer connections and media streams
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: PeerConnectionConfig;
  private iceCandidateCallback: ((event: ICECandidateEvent) => void) | null = null;
  private remoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private connectionStateCallback: ((state: WebRTCConnectionState) => void) | null = null;
  private iceConnectionStateCallback: ((state: ICEConnectionState) => void) | null = null;

  constructor(config?: PeerConnectionConfig) {
    this.config = config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
    };
  }

  // ==========================================================================
  // Local Stream Management
  // ==========================================================================

  /**
   * Get local media stream (camera + microphone)
   * 
   * @param constraints - Media constraints for video/audio
   * @returns Promise resolving to MediaStream
   */
  async getLocalStream(constraints?: MediaConstraints): Promise<MediaStream> {
    if (!loadWebRTC()) {
      throw new Error('react-native-webrtc is not available');
    }

    const defaultConstraints: MediaConstraints = {
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

    const mergedConstraints = {
      ...defaultConstraints,
      ...constraints,
    };

    try {
      const stream = await mediaDevices.getUserMedia(mergedConstraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('[WebRTCManager] Failed to get local stream:', error);
      throw error;
    }
  }

  /**
   * Stop the local media stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Get the current local stream
   */
  getLocalStreamInstance(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
      (videoTrack as any)._switchCamera();
    } else {
      throw new Error('Camera switch not supported');
    }
  }

  /**
   * Toggle video track on/off
   * 
   * @param enabled - Whether video should be enabled
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle audio track on/off
   * 
   * @param enabled - Whether audio should be enabled
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
    }
  }

  // ==========================================================================
  // Peer Connection Management
  // ==========================================================================

  /**
   * Create a new peer connection
   * 
   * @param config - Optional peer connection configuration
   * @returns The created RTCPeerConnection
   */
  createPeerConnection(config?: PeerConnectionConfig): RTCPeerConnection {
    if (!loadWebRTC()) {
      throw new Error('react-native-webrtc is not available');
    }

    const pcConfig = config || this.config;
    const pc = new RTCPeerConnection(pcConfig);
    this.peerConnection = pc;

    this.setupPeerConnectionListeners();

    return pc;
  }

  /**
   * Get the current peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  /**
   * Close the peer connection
   */
  closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }

  /**
   * Setup listeners for peer connection events
   */
  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event: any) => {
      if (this.iceCandidateCallback) {
        this.iceCandidateCallback({
          candidate: event.candidate,
          sdpMid: event.candidate?.sdpMid,
          sdpMLineIndex: event.candidate?.sdpMLineIndex,
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        this.remoteStream = stream;
        if (this.remoteStreamCallback) {
          this.remoteStreamCallback(stream);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.connectionStateCallback && this.peerConnection) {
        this.connectionStateCallback(
          this.peerConnection.connectionState as WebRTCConnectionState
        );
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.iceConnectionStateCallback && this.peerConnection) {
        this.iceConnectionStateCallback(
          this.peerConnection.iceConnectionState as ICEConnectionState
        );
      }
    };
  }

  /**
   * Add local stream to peer connection
   * 
   * @param stream - The local MediaStream to add
   */
  addLocalStream(stream: MediaStream): void {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    stream.getTracks().forEach((track: any) => {
      this.peerConnection!.addTrack(track, stream);
    });
  }

  /**
   * Get the remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // ==========================================================================
  // Signaling Helpers
  // ==========================================================================

  /**
   * Create an SDP offer
   * 
   * @returns Promise resolving to SessionDescription
   */
  async createOffer(): Promise<SessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);

    return {
      type: 'offer',
      sdp: offer.sdp ?? '',
    };
  }

  /**
   * Create an SDP answer
   * 
   * @returns Promise resolving to SessionDescription
   */
  async createAnswer(): Promise<SessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    return {
      type: 'answer',
      sdp: answer.sdp ?? '',
    };
  }

  /**
   * Set the remote SDP description
   * 
   * @param description - The remote SessionDescription
   */
  async setRemoteDescription(description: SessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    if (!loadWebRTC()) {
      throw new Error('react-native-webrtc is not available');
    }

    const rtcDescription = new RTCSessionDescription(description);
    await this.peerConnection.setRemoteDescription(rtcDescription);
  }

  /**
   * Add an ICE candidate from remote peer
   * 
   * @param candidate - The ICE candidate to add
   */
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    if (!loadWebRTC()) {
      throw new Error('react-native-webrtc is not available');
    }

    const iceCandidate = new RTCIceCandidate(candidate);
    await this.peerConnection.addIceCandidate(iceCandidate);
  }

  // ==========================================================================
  // Event Callbacks
  // ==========================================================================

  /**
   * Register callback for ICE candidates
   * 
   * @param callback - Function to call when ICE candidate is generated
   */
  onIceCandidate(callback: (event: ICECandidateEvent) => void): void {
    this.iceCandidateCallback = callback;
  }

  /**
   * Register callback for remote stream
   * 
   * @param callback - Function to call when remote stream is received
   */
  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.remoteStreamCallback = callback;
  }

  /**
   * Register callback for connection state changes
   * 
   * @param callback - Function to call when connection state changes
   */
  onConnectionStateChange(callback: (state: WebRTCConnectionState) => void): void {
    this.connectionStateCallback = callback;
  }

  /**
   * Register callback for ICE connection state changes
   * 
   * @param callback - Function to call when ICE connection state changes
   */
  onIceConnectionStateChange(callback: (state: ICEConnectionState) => void): void {
    this.iceConnectionStateCallback = callback;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.stopLocalStream();
    this.closePeerConnection();
    this.iceCandidateCallback = null;
    this.remoteStreamCallback = null;
    this.connectionStateCallback = null;
    this.iceConnectionStateCallback = null;
  }
}

// Singleton instance for convenience
let managerInstance: WebRTCManager | null = null;

/**
 * Get the shared WebRTC manager instance
 */
export function getWebRTCManager(config?: PeerConnectionConfig): WebRTCManager {
  if (!managerInstance) {
    managerInstance = new WebRTCManager(config);
  }
  return managerInstance;
}

/**
 * Create a new WebRTC manager instance
 */
export function createWebRTCManager(config?: PeerConnectionConfig): WebRTCManager {
  return new WebRTCManager(config);
}

