package com.smartcamera

import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

// Data class to track current options for comparison
private data class DetectorConfig(
    val performanceMode: String,
    val landmarkMode: String,
    val contourMode: String,
    val classificationMode: String,
    val minFaceSize: Float,
    val trackingEnabled: Boolean,
    val autoMode: Boolean,
    val windowWidth: Float,
    val windowHeight: Float,
    val cameraFacing: String
)

class FaceDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {
    
    companion object {
        private const val TAG = "FaceDetectorPlugin"
    }
    
    private var faceDetector: FaceDetector? = null
    private var currentConfig: DetectorConfig? = null
    
    init {
        Log.d(TAG, "FaceDetectorFrameProcessorPlugin initialized")
        updateDetectorOptions(options ?: emptyMap())
    }
    
    private fun updateDetectorOptions(options: Map<String, Any>) {
        val performanceMode = options["performanceMode"] as? String ?: "fast"
        val landmarkMode = options["landmarkMode"] as? String ?: "none"
        val contourMode = options["contourMode"] as? String ?: "none"
        val classificationMode = options["classificationMode"] as? String ?: "none"
        val minFaceSize = (options["minFaceSize"] as? Number)?.toFloat() ?: 0.15f
        val trackingEnabled = options["trackingEnabled"] as? Boolean ?: false
        val autoMode = options["autoMode"] as? Boolean ?: false
        val windowWidth = (options["windowWidth"] as? Number)?.toFloat() ?: 1.0f
        val windowHeight = (options["windowHeight"] as? Number)?.toFloat() ?: 1.0f
        val cameraFacing = options["cameraFacing"] as? String ?: "front"
        
        val newConfig = DetectorConfig(
            performanceMode = performanceMode,
            landmarkMode = landmarkMode,
            contourMode = contourMode,
            classificationMode = classificationMode,
            minFaceSize = minFaceSize,
            trackingEnabled = trackingEnabled,
            autoMode = autoMode,
            windowWidth = windowWidth,
            windowHeight = windowHeight,
            cameraFacing = cameraFacing
        )
        
        // Only recreate detector if core options changed
        if (currentConfig != null &&
            currentConfig!!.performanceMode == newConfig.performanceMode &&
            currentConfig!!.landmarkMode == newConfig.landmarkMode &&
            currentConfig!!.contourMode == newConfig.contourMode &&
            currentConfig!!.classificationMode == newConfig.classificationMode &&
            currentConfig!!.minFaceSize == newConfig.minFaceSize &&
            currentConfig!!.trackingEnabled == newConfig.trackingEnabled) {
            // Only update non-detector options
            currentConfig = newConfig
            return
        }
        
        val optionsBuilder = FaceDetectorOptions.Builder()
        
        when (performanceMode) {
            "accurate" -> optionsBuilder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            else -> optionsBuilder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        }
        
        when (landmarkMode) {
            "all" -> optionsBuilder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            else -> optionsBuilder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
        }
        
        when (contourMode) {
            "all" -> optionsBuilder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
            else -> optionsBuilder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
        }
        
        when (classificationMode) {
            "all" -> optionsBuilder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            else -> optionsBuilder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        }
        
        optionsBuilder.setMinFaceSize(minFaceSize)
        
        if (trackingEnabled) {
            optionsBuilder.enableTracking()
        }
        
        faceDetector?.close()
        faceDetector = FaceDetection.getClient(optionsBuilder.build())
        currentConfig = newConfig
        Log.d(TAG, "Face detector updated with new options")
    }
    
    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any {
        if (arguments != null && arguments.isNotEmpty()) {
            updateDetectorOptions(arguments)
        }
        
        val detector = faceDetector ?: run {
            Log.e(TAG, "Face detector not initialized")
            return emptyList<Map<String, Any>>()
        }
        
        val config = currentConfig ?: return emptyList<Map<String, Any>>()
        
        try {
            val mediaImage = frame.image
            val inputImage = InputImage.fromMediaImage(
                mediaImage,
                frame.orientation.toDegrees()
            )
            
            val faces = Tasks.await(detector.process(inputImage))
            
            return faces.map { face -> 
                faceToMap(
                    face, 
                    frame.width, 
                    frame.height,
                    config.autoMode,
                    config.windowWidth,
                    config.windowHeight,
                    config.cameraFacing
                ) 
            }
        } catch (e: Exception) {
            Log.e(TAG, "Face detection error: ${e.message}")
            return emptyList<Map<String, Any>>()
        }
    }
    
    private fun faceToMap(
        face: Face, 
        frameWidth: Int, 
        frameHeight: Int,
        autoMode: Boolean,
        windowWidth: Float,
        windowHeight: Float,
        cameraFacing: String
    ): Map<String, Any> {
        val result = mutableMapOf<String, Any>()
        
        // Calculate scale factors for autoMode
        val scaleX = if (autoMode) windowWidth / frameWidth else 1.0f / frameWidth
        val scaleY = if (autoMode) windowHeight / frameHeight else 1.0f / frameHeight
        val mirrorX = autoMode && cameraFacing == "front"
        
        // Bounding box
        val bounds = face.boundingBox
        val x = if (mirrorX) {
            windowWidth - (bounds.right * scaleX)
        } else {
            bounds.left * scaleX
        }
        
        result["bounds"] = mapOf(
            "x" to x.toDouble(),
            "y" to (bounds.top * scaleY).toDouble(),
            "width" to (bounds.width() * scaleX).toDouble(),
            "height" to (bounds.height() * scaleY).toDouble()
        )
        
        // Roll, pitch, yaw angles
        result["rollAngle"] = face.headEulerAngleZ.toDouble()
        result["pitchAngle"] = face.headEulerAngleX.toDouble()
        result["yawAngle"] = face.headEulerAngleY.toDouble()
        
        // Classification probabilities
        face.smilingProbability?.let { result["smilingProbability"] = it.toDouble() }
        face.leftEyeOpenProbability?.let { result["leftEyeOpenProbability"] = it.toDouble() }
        face.rightEyeOpenProbability?.let { result["rightEyeOpenProbability"] = it.toDouble() }
        
        // Tracking ID
        face.trackingId?.let { result["trackingId"] = it }
        
        // Landmarks
        val landmarks = mutableMapOf<String, Any>()
        
        face.getLandmark(FaceLandmark.LEFT_EYE)?.let {
            landmarks["leftEye"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.RIGHT_EYE)?.let {
            landmarks["rightEye"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.NOSE_BASE)?.let {
            landmarks["noseBase"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.LEFT_CHEEK)?.let {
            landmarks["leftCheek"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.RIGHT_CHEEK)?.let {
            landmarks["rightCheek"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.MOUTH_LEFT)?.let {
            landmarks["mouthLeft"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.MOUTH_RIGHT)?.let {
            landmarks["mouthRight"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.MOUTH_BOTTOM)?.let {
            landmarks["mouthBottom"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.LEFT_EAR)?.let {
            landmarks["leftEar"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        face.getLandmark(FaceLandmark.RIGHT_EAR)?.let {
            landmarks["rightEar"] = pointToMap(it.position.x, it.position.y, scaleX, scaleY, mirrorX, windowWidth)
        }
        
        if (landmarks.isNotEmpty()) {
            result["landmarks"] = landmarks
        }
        
        // All contours (like reference package)
        val contours = mutableMapOf<String, Any>()
        
        face.getContour(FaceContour.FACE)?.let { contour ->
            contours["face"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LEFT_EYEBROW_TOP)?.let { contour ->
            contours["leftEyebrowTop"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LEFT_EYEBROW_BOTTOM)?.let { contour ->
            contours["leftEyebrowBottom"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.RIGHT_EYEBROW_TOP)?.let { contour ->
            contours["rightEyebrowTop"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.RIGHT_EYEBROW_BOTTOM)?.let { contour ->
            contours["rightEyebrowBottom"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LEFT_EYE)?.let { contour ->
            contours["leftEye"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.RIGHT_EYE)?.let { contour ->
            contours["rightEye"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.UPPER_LIP_TOP)?.let { contour ->
            contours["upperLipTop"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.UPPER_LIP_BOTTOM)?.let { contour ->
            contours["upperLipBottom"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LOWER_LIP_TOP)?.let { contour ->
            contours["lowerLipTop"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LOWER_LIP_BOTTOM)?.let { contour ->
            contours["lowerLipBottom"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.NOSE_BRIDGE)?.let { contour ->
            contours["noseBridge"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.NOSE_BOTTOM)?.let { contour ->
            contours["noseBottom"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.LEFT_CHEEK)?.let { contour ->
            contours["leftCheek"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        face.getContour(FaceContour.RIGHT_CHEEK)?.let { contour ->
            contours["rightCheek"] = contour.points.map { p -> pointToMap(p.x, p.y, scaleX, scaleY, mirrorX, windowWidth) }
        }
        
        if (contours.isNotEmpty()) {
            result["contours"] = contours
        }
        
        return result
    }
    
    private fun pointToMap(
        x: Float, 
        y: Float, 
        scaleX: Float, 
        scaleY: Float,
        mirrorX: Boolean,
        windowWidth: Float
    ): Map<String, Double> {
        val scaledX = if (mirrorX) {
            windowWidth - (x * scaleX)
        } else {
            x * scaleX
        }
        return mapOf(
            "x" to scaledX.toDouble(),
            "y" to (y * scaleY).toDouble()
        )
    }
    
    private fun com.mrousavy.camera.core.types.Orientation.toDegrees(): Int {
        return when (this) {
            com.mrousavy.camera.core.types.Orientation.PORTRAIT -> 0
            com.mrousavy.camera.core.types.Orientation.LANDSCAPE_LEFT -> 90
            com.mrousavy.camera.core.types.Orientation.PORTRAIT_UPSIDE_DOWN -> 180
            com.mrousavy.camera.core.types.Orientation.LANDSCAPE_RIGHT -> 270
        }
    }
    
    protected fun finalize() {
        faceDetector?.close()
    }
}

