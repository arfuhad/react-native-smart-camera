import {
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withProjectBuildGradle,
  AndroidConfig,
} from '@expo/config-plugins';

export interface AndroidPluginOptions {
  enableMLKit: boolean;
  enableWebRTC: boolean;
}

/**
 * Add camera and microphone permissions to AndroidManifest.xml
 */
const withPermissions: ConfigPlugin<AndroidPluginOptions> = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Ensure permissions array exists
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const permissions = manifest.manifest['uses-permission'];

    // Camera permission
    const cameraPermission = 'android.permission.CAMERA';
    if (!permissions.some((p) => p.$?.['android:name'] === cameraPermission)) {
      permissions.push({
        $: { 'android:name': cameraPermission },
      });
    }

    // Microphone permission
    const micPermission = 'android.permission.RECORD_AUDIO';
    if (!permissions.some((p) => p.$?.['android:name'] === micPermission)) {
      permissions.push({
        $: { 'android:name': micPermission },
      });
    }

    // Camera hardware feature
    if (!manifest.manifest['uses-feature']) {
      manifest.manifest['uses-feature'] = [];
    }

    const features = manifest.manifest['uses-feature'];
    const cameraFeature = 'android.hardware.camera';
    if (!features.some((f) => f.$?.['android:name'] === cameraFeature)) {
      features.push({
        $: {
          'android:name': cameraFeature,
          'android:required': 'false',
        },
      });
    }

    const cameraAutoFocus = 'android.hardware.camera.autofocus';
    if (!features.some((f) => f.$?.['android:name'] === cameraAutoFocus)) {
      features.push({
        $: {
          'android:name': cameraAutoFocus,
          'android:required': 'false',
        },
      });
    }

    return config;
  });
};

/**
 * Add ML Kit dependency to app build.gradle
 */
const withMLKitDependency: ConfigPlugin<AndroidPluginOptions> = (config, options) => {
  if (!options.enableMLKit) {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults;

    // Check if ML Kit is already added
    if (!buildGradle.contents.includes('com.google.mlkit:face-detection')) {
      // Add ML Kit dependency in dependencies block
      buildGradle.contents = buildGradle.contents.replace(
        /dependencies\s*{/,
        `dependencies {
    // SmartCamera ML Kit Face Detection
    implementation 'com.google.mlkit:face-detection:16.1.5'`
      );
    }

    return config;
  });
};

/**
 * Add proguard rules for ML Kit
 */
const withProguardRules: ConfigPlugin<AndroidPluginOptions> = (config, options) => {
  if (!options.enableMLKit) {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults;

    // Check if proguard is already configured for ML Kit
    if (!buildGradle.contents.includes('mlkit-proguard-rules.pro')) {
      // Add proguard configuration in release build type
      buildGradle.contents = buildGradle.contents.replace(
        /buildTypes\s*{\s*release\s*{/,
        `buildTypes {
        release {
            // SmartCamera ML Kit Proguard rules
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'`
      );
    }

    return config;
  });
};

/**
 * Android configuration for react-native-smart-camera
 */
export const withSmartCameraAndroid: ConfigPlugin<AndroidPluginOptions> = (config, options) => {
  // Add permissions
  config = withPermissions(config);

  // Add ML Kit dependency if enabled
  config = withMLKitDependency(config, options);

  // Add proguard rules if ML Kit enabled
  config = withProguardRules(config, options);

  return config;
};

