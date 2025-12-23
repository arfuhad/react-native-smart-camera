import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { ViewProps } from 'react-native';

export interface SmartCameraViewProps extends ViewProps {
  cameraFacing?: 'front' | 'back';
  isActive?: boolean;
}

const NativeView = requireNativeViewManager('SmartCameraView');

export function SmartCameraView(props: SmartCameraViewProps) {
  return <NativeView {...props} />;
}

