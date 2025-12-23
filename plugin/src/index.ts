import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import { withSmartCameraIOS } from './withSmartCameraIOS';
import { withSmartCameraAndroid } from './withSmartCameraAndroid';

const pkg = require('../../package.json');

/**
 * Plugin options for react-native-smart-camera
 */
export interface SmartCameraPluginOptions {
  /**
   * Custom camera usage description for iOS
   * @default "This app uses the camera for face detection and video streaming"
   */
  cameraPermissionText?: string;

  /**
   * Custom microphone usage description for iOS
   * @default "This app uses the microphone for audio streaming"
   */
  microphonePermissionText?: string;

  /**
   * Enable ML Kit Face Detection
   * @default true
   */
  enableMLKit?: boolean;

  /**
   * Enable WebRTC support
   * @default true
   */
  enableWebRTC?: boolean;
}

/**
 * Expo config plugin for react-native-smart-camera
 * 
 * This plugin:
 * - Adds camera and microphone permissions
 * - Configures iOS frameworks
 * - Sets up Android Proguard rules
 * - Adds ML Kit dependencies
 */
const withSmartCamera: ConfigPlugin<SmartCameraPluginOptions | void> = (config, options = {}) => {
  const {
    cameraPermissionText = 'This app uses the camera for face detection and video streaming',
    microphonePermissionText = 'This app uses the microphone for audio streaming',
    enableMLKit = true,
    enableWebRTC = true,
  } = options ?? {};

  // Apply iOS configuration
  config = withSmartCameraIOS(config, {
    cameraPermissionText,
    microphonePermissionText,
    enableMLKit,
    enableWebRTC,
  });

  // Apply Android configuration
  config = withSmartCameraAndroid(config, {
    enableMLKit,
    enableWebRTC,
  });

  return config;
};

export default createRunOncePlugin(withSmartCamera, pkg.name, pkg.version);

