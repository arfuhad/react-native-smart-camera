import {
  ConfigPlugin,
  withInfoPlist,
  withPodfile,
  IOSConfig,
} from '@expo/config-plugins';

export interface IOSPluginOptions {
  cameraPermissionText: string;
  microphonePermissionText: string;
  enableMLKit: boolean;
  enableWebRTC: boolean;
}

/**
 * Add camera and microphone permissions to Info.plist
 */
const withPermissions: ConfigPlugin<IOSPluginOptions> = (config, options) => {
  return withInfoPlist(config, (config) => {
    // Camera permission
    config.modResults.NSCameraUsageDescription =
      config.modResults.NSCameraUsageDescription ?? options.cameraPermissionText;

    // Microphone permission
    config.modResults.NSMicrophoneUsageDescription =
      config.modResults.NSMicrophoneUsageDescription ?? options.microphonePermissionText;

    return config;
  });
};

/**
 * Add ML Kit pod to Podfile if enabled
 */
const withMLKitPod: ConfigPlugin<IOSPluginOptions> = (config, options) => {
  if (!options.enableMLKit) {
    return config;
  }

  return withPodfile(config, (config) => {
    const podfile = config.modResults;
    
    // Check if ML Kit pod is already added
    if (!podfile.contents.includes('GoogleMLKit/FaceDetection')) {
      // Add ML Kit pod after the use_expo_modules! line
      podfile.contents = podfile.contents.replace(
        /use_expo_modules!/,
        `use_expo_modules!

  # SmartCamera ML Kit Face Detection
  pod 'GoogleMLKit/FaceDetection', '~> 4.0.0'`
      );
    }

    return config;
  });
};

/**
 * iOS configuration for react-native-smart-camera
 */
export const withSmartCameraIOS: ConfigPlugin<IOSPluginOptions> = (config, options) => {
  // Add permissions
  config = withPermissions(config, options);

  // Add ML Kit pod if enabled
  config = withMLKitPod(config, options);

  return config;
};

