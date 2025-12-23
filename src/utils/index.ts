/**
 * SmartCamera utility functions
 */

// ============================================================================
// FPS Limiter
// ============================================================================

/**
 * Creates an FPS limiter for frame processing
 * 
 * @param targetFps - Target frames per second
 * @returns Object with shouldProcess function
 * 
 * @example
 * ```ts
 * const limiter = createFpsLimiter(15);
 * 
 * const frameProcessor = useFrameProcessor((frame) => {
 *   if (!limiter.shouldProcess()) return;
 *   // Process frame...
 * }, []);
 * ```
 */
export function createFpsLimiter(targetFps: number) {
  const frameInterval = 1000 / targetFps;
  let lastFrameTime = 0;

  return {
    shouldProcess: (): boolean => {
      const now = Date.now();
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        return true;
      }
      return false;
    },
    reset: () => {
      lastFrameTime = 0;
    },
    setTargetFps: (fps: number) => {
      // Note: This creates a new interval but doesn't update the closure
      // Consider using a ref if dynamic FPS changes are needed
    },
  };
}

// ============================================================================
// Debounce
// ============================================================================

/**
 * Creates a debounced function
 * 
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// ============================================================================
// Throttle
// ============================================================================

/**
 * Creates a throttled function
 * 
 * @param fn - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

// ============================================================================
// Memory Pool for Face Objects
// ============================================================================

interface PooledObject<T> {
  data: T;
  inUse: boolean;
}

/**
 * Creates an object pool for reducing garbage collection
 * 
 * @param factory - Factory function to create new objects
 * @param initialSize - Initial pool size
 * @param maxSize - Maximum pool size
 */
export function createObjectPool<T>(
  factory: () => T,
  initialSize: number = 10,
  maxSize: number = 100
) {
  const pool: PooledObject<T>[] = [];

  // Pre-populate pool
  for (let i = 0; i < initialSize; i++) {
    pool.push({ data: factory(), inUse: false });
  }

  return {
    acquire: (): T => {
      // Find an available object
      const available = pool.find((obj) => !obj.inUse);
      if (available) {
        available.inUse = true;
        return available.data;
      }

      // Create new if pool not at max
      if (pool.length < maxSize) {
        const newObj = { data: factory(), inUse: true };
        pool.push(newObj);
        return newObj.data;
      }

      // Pool exhausted, create temporary object
      return factory();
    },

    release: (obj: T): void => {
      const pooledObj = pool.find((p) => p.data === obj);
      if (pooledObj) {
        pooledObj.inUse = false;
      }
    },

    clear: (): void => {
      pool.length = 0;
    },

    getStats: () => ({
      size: pool.length,
      inUse: pool.filter((p) => p.inUse).length,
      available: pool.filter((p) => !p.inUse).length,
    }),
  };
}

// ============================================================================
// Error Utilities
// ============================================================================

import type { SmartCameraError, SmartCameraErrorCode } from '../types';

/**
 * Creates a SmartCameraError from an unknown error
 * 
 * @param error - The original error
 * @param defaultCode - Default error code if not determinable
 * @returns SmartCameraError
 */
export function createSmartCameraError(
  error: unknown,
  defaultCode: SmartCameraErrorCode = 'UNKNOWN_ERROR'
): SmartCameraError {
  if (error instanceof Error) {
    // Check for specific error types
    const message = error.message.toLowerCase();

    let code: SmartCameraErrorCode = defaultCode;
    if (message.includes('permission')) {
      code = 'PERMISSION_DENIED';
    } else if (message.includes('camera') && message.includes('unavailable')) {
      code = 'CAMERA_UNAVAILABLE';
    } else if (message.includes('webrtc')) {
      code = 'WEBRTC_ERROR';
    } else if (message.includes('mlkit') || message.includes('face detection')) {
      code = 'ML_KIT_ERROR';
    } else if (message.includes('frame processor')) {
      code = 'FRAME_PROCESSOR_ERROR';
    }

    return {
      code,
      message: error.message,
      nativeError: error,
    };
  }

  return {
    code: defaultCode,
    message: String(error),
  };
}

/**
 * Safely execute a function and return a SmartCameraError on failure
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorCode: SmartCameraErrorCode = 'UNKNOWN_ERROR'
): Promise<{ data: T; error: null } | { data: null; error: SmartCameraError }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: createSmartCameraError(error, errorCode) };
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates face detection options
 */
export function validateFaceDetectionOptions(options: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (options.minFaceSize !== undefined) {
    const minFaceSize = options.minFaceSize as number;
    if (typeof minFaceSize !== 'number' || minFaceSize < 0 || minFaceSize > 1) {
      errors.push('minFaceSize must be a number between 0 and 1');
    }
  }

  if (options.performanceMode !== undefined) {
    const mode = options.performanceMode as string;
    if (mode !== 'fast' && mode !== 'accurate') {
      errors.push('performanceMode must be "fast" or "accurate"');
    }
  }

  if (options.landmarkMode !== undefined) {
    const mode = options.landmarkMode as string;
    if (mode !== 'none' && mode !== 'all') {
      errors.push('landmarkMode must be "none" or "all"');
    }
  }

  if (options.contourMode !== undefined) {
    const mode = options.contourMode as string;
    if (mode !== 'none' && mode !== 'all') {
      errors.push('contourMode must be "none" or "all"');
    }
  }

  if (options.classificationMode !== undefined) {
    const mode = options.classificationMode as string;
    if (mode !== 'none' && mode !== 'all') {
      errors.push('classificationMode must be "none" or "all"');
    }
  }

  // Warn about contourMode + trackingEnabled combination
  if (options.contourMode === 'all' && options.trackingEnabled === true) {
    errors.push(
      'Warning: Using contourMode="all" with trackingEnabled=true is not recommended. ' +
      'Contour detection only works on the most prominent face, making tracking less useful.'
    );
  }

  return errors;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMetrics {
  frameCount: number;
  averageProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  droppedFrames: number;
}

/**
 * Creates a performance monitor for frame processing
 */
export function createPerformanceMonitor(windowSize: number = 30) {
  const processingTimes: number[] = [];
  let frameCount = 0;
  let droppedFrames = 0;
  let lastFrameTime = 0;
  const targetFrameTime = 1000 / 30; // 30 FPS target

  return {
    startFrame: (): number => {
      return Date.now();
    },

    endFrame: (startTime: number): void => {
      const processingTime = Date.now() - startTime;
      processingTimes.push(processingTime);
      
      // Keep only last N samples
      if (processingTimes.length > windowSize) {
        processingTimes.shift();
      }

      frameCount++;

      // Check for dropped frames
      const now = Date.now();
      if (lastFrameTime > 0) {
        const frameGap = now - lastFrameTime;
        if (frameGap > targetFrameTime * 2) {
          droppedFrames += Math.floor(frameGap / targetFrameTime) - 1;
        }
      }
      lastFrameTime = now;
    },

    getMetrics: (): PerformanceMetrics => {
      const times = processingTimes.length > 0 ? processingTimes : [0];
      return {
        frameCount,
        averageProcessingTime: times.reduce((a, b) => a + b, 0) / times.length,
        minProcessingTime: Math.min(...times),
        maxProcessingTime: Math.max(...times),
        droppedFrames,
      };
    },

    reset: (): void => {
      processingTimes.length = 0;
      frameCount = 0;
      droppedFrames = 0;
      lastFrameTime = 0;
    },
  };
}

