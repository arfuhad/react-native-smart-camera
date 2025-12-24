package com.smartcamera

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class SmartCameraPackage : ReactPackage {
    
    companion object {
        init {
            // Register the frame processor plugin with VisionCamera
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectFaces") { proxy, options ->
                FaceDetectorFrameProcessorPlugin(proxy, options)
            }
        }
    }
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}

