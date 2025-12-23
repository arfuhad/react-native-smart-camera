package expo.modules.smartcamera

import android.graphics.Bitmap
import android.graphics.PointF
import android.graphics.Rect
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class MLKitFaceDetector {
    // MARK: - Properties
    
    private var detector: FaceDetector? = null
    private var currentOptions: FaceDetectionOptions = FaceDetectionOptions()
    
    // MARK: - Configuration
    
    fun updateOptions(options: FaceDetectionOptions) {
        if (options != currentOptions) {
            currentOptions = options
            detector?.close()
            detector = createDetector(options)
        }
    }
    
    private fun createDetector(options: FaceDetectionOptions): FaceDetector {
        val builder = FaceDetectorOptions.Builder()
        
        // Performance mode
        when (options.performanceMode) {
            "fast" -> builder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            "accurate" -> builder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        }
        
        // Landmark mode
        when (options.landmarkMode) {
            "all" -> builder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            else -> builder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
        }
        
        // Contour mode
        when (options.contourMode) {
            "all" -> builder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
            else -> builder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
        }
        
        // Classification mode
        when (options.classificationMode) {
            "all" -> builder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            else -> builder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        }
        
        // Min face size
        builder.setMinFaceSize(options.minFaceSize.toFloat())
        
        // Tracking
        if (options.trackingEnabled) {
            builder.enableTracking()
        }
        
        return FaceDetection.getClient(builder.build())
    }
    
    // MARK: - Detection
    
    suspend fun detectFaces(bitmap: Bitmap): List<DetectedFace> {
        val faceDetector = detector ?: createDetector(currentOptions).also { detector = it }
        val inputImage = InputImage.fromBitmap(bitmap, 0)
        
        return suspendCancellableCoroutine { continuation ->
            faceDetector.process(inputImage)
                .addOnSuccessListener { faces ->
                    val detectedFaces = faces.mapIndexed { index, face ->
                        convertToDetectedFace(face, index)
                    }
                    continuation.resume(detectedFaces)
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }
    }
    
    // MARK: - Conversion
    
    private fun convertToDetectedFace(face: Face, index: Int): DetectedFace {
        val bounds = face.boundingBox
        
        return DetectedFace(
            bounds = FaceBounds(
                x = bounds.left.toDouble(),
                y = bounds.top.toDouble(),
                width = bounds.width().toDouble(),
                height = bounds.height().toDouble()
            ),
            landmarks = if (currentOptions.landmarkMode == "all") extractLandmarks(face) else null,
            contours = if (currentOptions.contourMode == "all") extractContours(face) else null,
            smilingProbability = face.smilingProbability?.toDouble(),
            leftEyeOpenProbability = face.leftEyeOpenProbability?.toDouble(),
            rightEyeOpenProbability = face.rightEyeOpenProbability?.toDouble(),
            trackingId = if (currentOptions.trackingEnabled) face.trackingId else null,
            headEulerAngleX = face.headEulerAngleX.toDouble(),
            headEulerAngleY = face.headEulerAngleY.toDouble(),
            headEulerAngleZ = face.headEulerAngleZ.toDouble()
        )
    }
    
    private fun extractLandmarks(face: Face): FaceLandmarksData {
        return FaceLandmarksData(
            leftEye = face.getLandmark(FaceLandmark.LEFT_EYE)?.position?.toPointData(),
            rightEye = face.getLandmark(FaceLandmark.RIGHT_EYE)?.position?.toPointData(),
            leftEar = face.getLandmark(FaceLandmark.LEFT_EAR)?.position?.toPointData(),
            rightEar = face.getLandmark(FaceLandmark.RIGHT_EAR)?.position?.toPointData(),
            leftCheek = face.getLandmark(FaceLandmark.LEFT_CHEEK)?.position?.toPointData(),
            rightCheek = face.getLandmark(FaceLandmark.RIGHT_CHEEK)?.position?.toPointData(),
            noseBase = face.getLandmark(FaceLandmark.NOSE_BASE)?.position?.toPointData(),
            mouthLeft = face.getLandmark(FaceLandmark.MOUTH_LEFT)?.position?.toPointData(),
            mouthRight = face.getLandmark(FaceLandmark.MOUTH_RIGHT)?.position?.toPointData(),
            mouthBottom = face.getLandmark(FaceLandmark.MOUTH_BOTTOM)?.position?.toPointData()
        )
    }
    
    private fun extractContours(face: Face): FaceContoursData {
        return FaceContoursData(
            face = face.getContour(FaceContour.FACE)?.points?.map { it.toPointData() },
            leftEyebrowTop = face.getContour(FaceContour.LEFT_EYEBROW_TOP)?.points?.map { it.toPointData() },
            leftEyebrowBottom = face.getContour(FaceContour.LEFT_EYEBROW_BOTTOM)?.points?.map { it.toPointData() },
            rightEyebrowTop = face.getContour(FaceContour.RIGHT_EYEBROW_TOP)?.points?.map { it.toPointData() },
            rightEyebrowBottom = face.getContour(FaceContour.RIGHT_EYEBROW_BOTTOM)?.points?.map { it.toPointData() },
            leftEye = face.getContour(FaceContour.LEFT_EYE)?.points?.map { it.toPointData() },
            rightEye = face.getContour(FaceContour.RIGHT_EYE)?.points?.map { it.toPointData() },
            upperLipTop = face.getContour(FaceContour.UPPER_LIP_TOP)?.points?.map { it.toPointData() },
            upperLipBottom = face.getContour(FaceContour.UPPER_LIP_BOTTOM)?.points?.map { it.toPointData() },
            lowerLipTop = face.getContour(FaceContour.LOWER_LIP_TOP)?.points?.map { it.toPointData() },
            lowerLipBottom = face.getContour(FaceContour.LOWER_LIP_BOTTOM)?.points?.map { it.toPointData() },
            noseBridge = face.getContour(FaceContour.NOSE_BRIDGE)?.points?.map { it.toPointData() },
            noseBottom = face.getContour(FaceContour.NOSE_BOTTOM)?.points?.map { it.toPointData() }
        )
    }
    
    // MARK: - Cleanup
    
    fun close() {
        detector?.close()
        detector = null
    }
}

// MARK: - Extensions

private fun PointF.toPointData(): PointData = PointData(x.toDouble(), y.toDouble())

// MARK: - Data Classes

data class DetectedFace(
    val bounds: FaceBounds,
    val landmarks: FaceLandmarksData? = null,
    val contours: FaceContoursData? = null,
    val smilingProbability: Double? = null,
    val leftEyeOpenProbability: Double? = null,
    val rightEyeOpenProbability: Double? = null,
    val trackingId: Int? = null,
    val headEulerAngleX: Double? = null,
    val headEulerAngleY: Double? = null,
    val headEulerAngleZ: Double? = null
) {
    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>(
            "bounds" to mapOf(
                "x" to bounds.x,
                "y" to bounds.y,
                "width" to bounds.width,
                "height" to bounds.height
            )
        )
        
        landmarks?.let { map["landmarks"] = it.toMap() }
        contours?.let { map["contours"] = it.toMap() }
        smilingProbability?.let { map["smilingProbability"] = it }
        leftEyeOpenProbability?.let { map["leftEyeOpenProbability"] = it }
        rightEyeOpenProbability?.let { map["rightEyeOpenProbability"] = it }
        trackingId?.let { map["trackingId"] = it }
        headEulerAngleX?.let { map["headEulerAngleX"] = it }
        headEulerAngleY?.let { map["headEulerAngleY"] = it }
        headEulerAngleZ?.let { map["headEulerAngleZ"] = it }
        
        return map
    }
}

data class FaceBounds(
    val x: Double,
    val y: Double,
    val width: Double,
    val height: Double
)

data class PointData(
    val x: Double,
    val y: Double
) {
    fun toMap(): Map<String, Any> = mapOf("x" to x, "y" to y)
}

data class FaceLandmarksData(
    val leftEye: PointData? = null,
    val rightEye: PointData? = null,
    val leftEar: PointData? = null,
    val rightEar: PointData? = null,
    val leftCheek: PointData? = null,
    val rightCheek: PointData? = null,
    val noseBase: PointData? = null,
    val mouthLeft: PointData? = null,
    val mouthRight: PointData? = null,
    val mouthBottom: PointData? = null
) {
    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        leftEye?.let { map["leftEye"] = it.toMap() }
        rightEye?.let { map["rightEye"] = it.toMap() }
        leftEar?.let { map["leftEar"] = it.toMap() }
        rightEar?.let { map["rightEar"] = it.toMap() }
        leftCheek?.let { map["leftCheek"] = it.toMap() }
        rightCheek?.let { map["rightCheek"] = it.toMap() }
        noseBase?.let { map["noseBase"] = it.toMap() }
        mouthLeft?.let { map["mouthLeft"] = it.toMap() }
        mouthRight?.let { map["mouthRight"] = it.toMap() }
        mouthBottom?.let { map["mouthBottom"] = it.toMap() }
        return map
    }
}

data class FaceContoursData(
    val face: List<PointData>? = null,
    val leftEyebrowTop: List<PointData>? = null,
    val leftEyebrowBottom: List<PointData>? = null,
    val rightEyebrowTop: List<PointData>? = null,
    val rightEyebrowBottom: List<PointData>? = null,
    val leftEye: List<PointData>? = null,
    val rightEye: List<PointData>? = null,
    val upperLipTop: List<PointData>? = null,
    val upperLipBottom: List<PointData>? = null,
    val lowerLipTop: List<PointData>? = null,
    val lowerLipBottom: List<PointData>? = null,
    val noseBridge: List<PointData>? = null,
    val noseBottom: List<PointData>? = null
) {
    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        face?.let { map["face"] = it.map { p -> p.toMap() } }
        leftEyebrowTop?.let { map["leftEyebrowTop"] = it.map { p -> p.toMap() } }
        leftEyebrowBottom?.let { map["leftEyebrowBottom"] = it.map { p -> p.toMap() } }
        rightEyebrowTop?.let { map["rightEyebrowTop"] = it.map { p -> p.toMap() } }
        rightEyebrowBottom?.let { map["rightEyebrowBottom"] = it.map { p -> p.toMap() } }
        leftEye?.let { map["leftEye"] = it.map { p -> p.toMap() } }
        rightEye?.let { map["rightEye"] = it.map { p -> p.toMap() } }
        upperLipTop?.let { map["upperLipTop"] = it.map { p -> p.toMap() } }
        upperLipBottom?.let { map["upperLipBottom"] = it.map { p -> p.toMap() } }
        lowerLipTop?.let { map["lowerLipTop"] = it.map { p -> p.toMap() } }
        lowerLipBottom?.let { map["lowerLipBottom"] = it.map { p -> p.toMap() } }
        noseBridge?.let { map["noseBridge"] = it.map { p -> p.toMap() } }
        noseBottom?.let { map["noseBottom"] = it.map { p -> p.toMap() } }
        return map
    }
}

