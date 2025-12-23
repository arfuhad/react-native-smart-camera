import type { Face, BlinkEvent } from '../types';

/**
 * Threshold for considering an eye as closed
 */
const EYE_CLOSED_THRESHOLD = 0.4;

/**
 * Threshold for considering an eye as open
 */
const EYE_OPEN_THRESHOLD = 0.6;

/**
 * State for tracking blink across frames
 */
interface BlinkState {
  wasEyesClosed: boolean;
  lastBlinkTimestamp: number;
}

// Global blink state per face tracking ID
const blinkStates = new Map<number, BlinkState>();

/**
 * Process faces to detect blinks
 * 
 * @param faces - Array of detected faces
 * @param lastBlinkTimestamp - Timestamp of the last detected blink
 * @param debounceMs - Minimum time between blinks in milliseconds
 * @returns BlinkEvent if a blink was detected, null otherwise
 */
export function processBlinkFromFaces(
  faces: Face[],
  lastBlinkTimestamp: number,
  debounceMs: number = 300
): BlinkEvent | null {
  'worklet';

  if (faces.length === 0) {
    return null;
  }

  // Use the first face (most prominent)
  const face = faces[0];

  // Ensure we have eye classification data
  if (
    face.leftEyeOpenProbability === undefined ||
    face.rightEyeOpenProbability === undefined
  ) {
    return null;
  }

  const leftEyeOpen = face.leftEyeOpenProbability;
  const rightEyeOpen = face.rightEyeOpenProbability;
  const now = Date.now();

  // Get or create blink state for this face
  const faceId = face.trackingId ?? 0;
  let state = blinkStates.get(faceId);

  if (!state) {
    state = {
      wasEyesClosed: false,
      lastBlinkTimestamp: 0,
    };
    blinkStates.set(faceId, state);
  }

  // Check if eyes are currently closed
  const eyesClosed = leftEyeOpen < EYE_CLOSED_THRESHOLD && rightEyeOpen < EYE_CLOSED_THRESHOLD;

  // Check if eyes are currently open
  const eyesOpen = leftEyeOpen > EYE_OPEN_THRESHOLD && rightEyeOpen > EYE_OPEN_THRESHOLD;

  // Detect blink: transition from closed to open
  const isBlink = state.wasEyesClosed && eyesOpen && (now - state.lastBlinkTimestamp) > debounceMs;

  // Update state
  if (eyesClosed) {
    state.wasEyesClosed = true;
  } else if (eyesOpen) {
    state.wasEyesClosed = false;
  }

  if (isBlink) {
    state.lastBlinkTimestamp = now;

    return {
      timestamp: now,
      leftEyeOpen,
      rightEyeOpen,
      isBlink: true,
      faceId: face.trackingId,
    };
  }

  return null;
}

/**
 * Reset blink state for all faces
 */
export function resetBlinkStates(): void {
  blinkStates.clear();
}

/**
 * Get current eye state without blink detection
 * Useful for real-time eye tracking UI
 */
export function getEyeState(face: Face): { leftOpen: number; rightOpen: number } | null {
  'worklet';

  if (
    face.leftEyeOpenProbability === undefined ||
    face.rightEyeOpenProbability === undefined
  ) {
    return null;
  }

  return {
    leftOpen: face.leftEyeOpenProbability,
    rightOpen: face.rightEyeOpenProbability,
  };
}

