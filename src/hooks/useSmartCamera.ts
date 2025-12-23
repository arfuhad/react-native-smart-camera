import { useState, useCallback, useMemo } from 'react';
import { useCameraDevice, useCameraPermission, Camera } from 'react-native-vision-camera';
import type { CameraFacing, UseSmartCameraResult, CameraDevice } from '../types';

/**
 * Hook for managing SmartCamera state and permissions
 * 
 * @returns Camera state, permission handlers, and device info
 * 
 * @example
 * ```tsx
 * function CameraScreen() {
 *   const { 
 *     hasPermission, 
 *     requestPermission, 
 *     device, 
 *     switchCamera,
 *     currentCamera 
 *   } = useSmartCamera();
 *   
 *   if (!hasPermission) {
 *     return <Button onPress={requestPermission} title="Grant Permission" />;
 *   }
 *   
 *   return <SmartCamera camera={currentCamera} />;
 * }
 * ```
 */
export function useSmartCamera(): UseSmartCameraResult {
  const [currentCamera, setCurrentCamera] = useState<CameraFacing>('front');
  const { hasPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const nativeDevice = useCameraDevice(currentCamera);

  // Map native device to our CameraDevice type
  const device: CameraDevice | undefined = useMemo(() => {
    if (!nativeDevice) return undefined;

    return {
      id: nativeDevice.id,
      name: nativeDevice.name,
      position: nativeDevice.position === 'front' ? 'front' : 'back',
      hasFlash: nativeDevice.hasFlash,
      hasTorch: nativeDevice.hasTorch,
      supportsLowLightBoost: nativeDevice.supportsLowLightBoost,
    };
  }, [nativeDevice]);

  // Request camera permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestCameraPermission();
    return result;
  }, [requestCameraPermission]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    setCurrentCamera((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  return {
    hasPermission,
    requestPermission,
    device,
    switchCamera,
    currentCamera,
  };
}

/**
 * Get all available camera devices
 */
export async function getAvailableCameras(): Promise<CameraDevice[]> {
  const devices = await Camera.getAvailableCameraDevices();
  
  return devices.map((device) => ({
    id: device.id,
    name: device.name,
    position: device.position === 'front' ? 'front' : 'back',
    hasFlash: device.hasFlash,
    hasTorch: device.hasTorch,
    supportsLowLightBoost: device.supportsLowLightBoost,
  }));
}

