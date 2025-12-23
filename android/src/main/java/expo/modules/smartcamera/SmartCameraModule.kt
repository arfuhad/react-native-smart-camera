package expo.modules.smartcamera

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL

class SmartCameraModule : Module() {
    companion object {
        private const val TAG = "SmartCameraModule"
        private const val DEFAULT_MIN_FACE_SIZE = 0.15
        private const val EYE_CLOSED_THRESHOLD = 0.3
        private const val EYE_OPEN_THRESHOLD = 0.7
    }

    // Coroutine scope for async operations
    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // Face detector instance
    private val faceDetector = MLKitFaceDetector()

    // WebRTC bridge instance
    private val webRTCBridge = WebRTCFrameBridge()

    // Image loader
    private val imageLoader = ImageLoader()

    // WebRTC state
    private var isWebRTCInitialized = false

    override fun definition() = ModuleDefinition {
        // Module name exposed to JavaScript
        Name("SmartCameraModule")

        // Module constants
        Constants(
            "PI" to Math.PI,
            "DEFAULT_MIN_FACE_SIZE" to DEFAULT_MIN_FACE_SIZE,
            "EYE_CLOSED_THRESHOLD" to EYE_CLOSED_THRESHOLD,
            "EYE_OPEN_THRESHOLD" to EYE_OPEN_THRESHOLD
        )

        // Events that can be sent to JavaScript
        Events("onFacesDetected", "onBlinkDetected", "onError", "onWebRTCStateChange")

        // MARK: - Face Detection Functions

        // Detect faces in a static image
        AsyncFunction("detectFacesInImage") { options: Map<String, Any>, promise: Promise ->
            moduleScope.launch {
                try {
                    // Parse options
                    val faceOptions = parseFaceDetectionOptions(options)
                    faceDetector.updateOptions(faceOptions)

                    // Get image source
                    val imageSource = options["image"]
                        ?: throw IllegalArgumentException("Image source is required")

                    // Load image
                    val bitmap = imageLoader.loadImage(imageSource)

                    // Detect faces
                    val faces = faceDetector.detectFaces(bitmap)

                    // Convert to maps
                    val faceMaps = faces.map { it.toMap() }
                    promise.resolve(faceMaps)
                } catch (e: Exception) {
                    Log.e(TAG, "Face detection error", e)
                    promise.reject("FACE_DETECTION_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }

        // Update face detection options
        Function("updateFaceDetectionOptions") { options: Map<String, Any> ->
            val faceOptions = parseFaceDetectionOptions(options)
            faceDetector.updateOptions(faceOptions)
        }

        // MARK: - WebRTC Functions

        // Initialize WebRTC
        AsyncFunction("initializeWebRTC") { promise: Promise ->
            moduleScope.launch {
                try {
                    webRTCBridge.initialize()
                    isWebRTCInitialized = true
                    promise.resolve(true)
                } catch (e: Exception) {
                    Log.e(TAG, "WebRTC init error", e)
                    promise.reject("WEBRTC_INIT_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }

        // Start WebRTC stream
        AsyncFunction("startWebRTCStream") { constraints: Map<String, Any>, promise: Promise ->
            moduleScope.launch {
                try {
                    if (!isWebRTCInitialized) {
                        throw IllegalStateException("WebRTC not initialized. Call initializeWebRTC first.")
                    }

                    val width = (constraints["width"] as? Number)?.toInt() ?: 1280
                    val height = (constraints["height"] as? Number)?.toInt() ?: 720
                    val frameRate = (constraints["frameRate"] as? Number)?.toInt() ?: 30

                    webRTCBridge.startStream(width, height, frameRate)

                    sendEvent("onWebRTCStateChange", mapOf("isStreaming" to true))
                    promise.resolve(true)
                } catch (e: Exception) {
                    Log.e(TAG, "WebRTC start error", e)
                    promise.reject("WEBRTC_START_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }

        // Stop WebRTC stream
        Function("stopWebRTCStream") {
            webRTCBridge.stopStream()
            sendEvent("onWebRTCStateChange", mapOf("isStreaming" to false))
        }

        // Push frame to WebRTC
        Function("pushWebRTCFrame") { frameData: Map<String, Any> ->
            webRTCBridge.pushFrame(frameData)
        }

        // Get WebRTC stream status
        Function("isWebRTCStreaming") {
            webRTCBridge.isStreaming()
        }

        // MARK: - Lifecycle

        // Called when module is destroyed
        OnDestroy {
            cleanup()
        }

        // Called when activity enters background
        OnActivityEntersBackground {
            Log.d(TAG, "App entered background")
            // Optionally pause processing
        }

        // Called when activity enters foreground
        OnActivityEntersForeground {
            Log.d(TAG, "App entered foreground")
            // Optionally resume processing
        }
    }

    // MARK: - Helper Methods

    private fun parseFaceDetectionOptions(options: Map<String, Any>): FaceDetectionOptions {
        return FaceDetectionOptions(
            performanceMode = options["performanceMode"] as? String ?: "fast",
            landmarkMode = options["landmarkMode"] as? String ?: "none",
            contourMode = options["contourMode"] as? String ?: "none",
            classificationMode = options["classificationMode"] as? String ?: "none",
            minFaceSize = (options["minFaceSize"] as? Number)?.toDouble() ?: DEFAULT_MIN_FACE_SIZE,
            trackingEnabled = options["trackingEnabled"] as? Boolean ?: false
        )
    }

    private fun cleanup() {
        Log.d(TAG, "Cleaning up module...")

        // Stop WebRTC
        webRTCBridge.destroy()
        isWebRTCInitialized = false

        // Close face detector
        faceDetector.close()

        // Cancel coroutines
        moduleScope.cancel()

        Log.d(TAG, "Cleanup completed")
    }
}

// MARK: - Face Detection Options

data class FaceDetectionOptions(
    val performanceMode: String = "fast",
    val landmarkMode: String = "none",
    val contourMode: String = "none",
    val classificationMode: String = "none",
    val minFaceSize: Double = 0.15,
    val trackingEnabled: Boolean = false
)
