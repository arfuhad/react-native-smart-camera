import { useState, useCallback, useRef, useEffect } from 'react';
import type { BlinkEvent, UseBlinkDetectionResult } from '../types';

/**
 * Options for useBlinkDetection hook
 */
export interface UseBlinkDetectionOptions {
  /** Whether blink detection is enabled. Default: true */
  enabled?: boolean;
  
  /** Minimum time between blinks in milliseconds. Default: 300 */
  debounceMs?: number;
  
  /** Callback when a blink is detected */
  onBlink?: (event: BlinkEvent) => void;
}

/**
 * Hook for managing blink detection state
 * 
 * @param options - Blink detection options
 * @returns Blink detection state and controls
 * 
 * @example
 * ```tsx
 * function BlinkCounter() {
 *   const { lastBlink, blinkCount, resetCount } = useBlinkDetection({
 *     debounceMs: 300,
 *     onBlink: (event) => {
 *       console.log('Blink detected at', event.timestamp);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <Text>Blinks: {blinkCount}</Text>
 *       <Button onPress={resetCount} title="Reset" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useBlinkDetection(
  options: UseBlinkDetectionOptions = {}
): UseBlinkDetectionResult {
  const { enabled = true, debounceMs = 300, onBlink } = options;
  
  const [lastBlink, setLastBlink] = useState<BlinkEvent | null>(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const callbackRef = useRef(onBlink);
  const lastBlinkTimeRef = useRef(0);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onBlink;
  }, [onBlink]);

  // Handle blink event (called from frame processor)
  const handleBlink = useCallback((event: BlinkEvent) => {
    const now = Date.now();
    
    // Apply debounce
    if (now - lastBlinkTimeRef.current < debounceMs) {
      return;
    }
    
    lastBlinkTimeRef.current = now;
    setLastBlink(event);
    setBlinkCount((prev) => prev + 1);
    callbackRef.current?.(event);
  }, [debounceMs]);

  // Reset blink count
  const resetCount = useCallback(() => {
    setBlinkCount(0);
    setLastBlink(null);
    lastBlinkTimeRef.current = 0;
  }, []);

  // Reset on disable
  useEffect(() => {
    if (!enabled) {
      resetCount();
    }
  }, [enabled, resetCount]);

  return {
    lastBlink,
    blinkCount,
    resetCount,
  };
}

