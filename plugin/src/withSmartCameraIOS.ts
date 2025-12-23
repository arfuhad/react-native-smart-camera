import {
  ConfigPlugin,
  withInfoPlist,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

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
  return withInfoPlist(config, (configWithInfoPlist) => {
    // Camera permission
    configWithInfoPlist.modResults.NSCameraUsageDescription =
      configWithInfoPlist.modResults.NSCameraUsageDescription ?? options.cameraPermissionText;

    // Microphone permission
    configWithInfoPlist.modResults.NSMicrophoneUsageDescription =
      configWithInfoPlist.modResults.NSMicrophoneUsageDescription ?? options.microphonePermissionText;

    return configWithInfoPlist;
  });
};

/**
 * Add ML Kit pod to Podfile if enabled
 */
const withMLKitPod: ConfigPlugin<IOSPluginOptions> = (config, options) => {
  if (!options.enableMLKit) {
    return config;
  }

  return withDangerousMod(config, [
    'ios',
    async (dangerousConfig) => {
      const podfilePath = path.join(dangerousConfig.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContents = fs.readFileSync(podfilePath, 'utf-8');
        
        // Check if ML Kit pod is already added
        if (!podfileContents.includes('GoogleMLKit/FaceDetection')) {
          // Add ML Kit pod after the use_expo_modules! line
          podfileContents = podfileContents.replace(
            /use_expo_modules!/,
            `use_expo_modules!

  # SmartCamera ML Kit Face Detection
  pod 'GoogleMLKit/FaceDetection', '~> 4.0.0'`
          );
          fs.writeFileSync(podfilePath, podfileContents);
        }
      }

      return dangerousConfig;
    },
  ]);
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

