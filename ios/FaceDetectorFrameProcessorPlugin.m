#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#if __has_include("react_native_smart_camera-Swift.h")
#import "react_native_smart_camera-Swift.h"
#else
#import <react_native_smart_camera/react_native_smart_camera-Swift.h>
#endif

// Register the frame processor plugin
VISION_EXPORT_FRAME_PROCESSOR(FaceDetectorFrameProcessorPlugin, detectFaces)
