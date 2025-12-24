import Foundation
import VisionCamera
import MLKitFaceDetection
import MLKitVision

@objc(FaceDetectorFrameProcessorPlugin)
public class FaceDetectorFrameProcessorPlugin: FrameProcessorPlugin {
    
    private var faceDetector: FaceDetector?
    private var currentOptions: FaceDetectorOptions?
    
    // Auto mode options (stored separately as they don't affect detector)
    private var autoMode: Bool = false
    private var windowWidth: CGFloat = 1.0
    private var windowHeight: CGFloat = 1.0
    private var cameraFacing: String = "front"
    
    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
        super.init(proxy: proxy, options: options)
        print("[FaceDetectorPlugin] Initialized")
        updateDetectorOptions(options as? [String: Any] ?? [:])
    }
    
    private func updateDetectorOptions(_ options: [String: Any]) {
        let performanceMode = options["performanceMode"] as? String ?? "fast"
        let landmarkMode = options["landmarkMode"] as? String ?? "none"
        let contourMode = options["contourMode"] as? String ?? "none"
        let classificationMode = options["classificationMode"] as? String ?? "none"
        let minFaceSize = options["minFaceSize"] as? CGFloat ?? 0.15
        let trackingEnabled = options["trackingEnabled"] as? Bool ?? false
        
        // Update auto mode options
        autoMode = options["autoMode"] as? Bool ?? false
        windowWidth = options["windowWidth"] as? CGFloat ?? 1.0
        windowHeight = options["windowHeight"] as? CGFloat ?? 1.0
        cameraFacing = options["cameraFacing"] as? String ?? "front"
        
        let newOptions = FaceDetectorOptions()
        
        switch performanceMode {
        case "accurate":
            newOptions.performanceMode = .accurate
        default:
            newOptions.performanceMode = .fast
        }
        
        switch landmarkMode {
        case "all":
            newOptions.landmarkMode = .all
        default:
            newOptions.landmarkMode = .none
        }
        
        switch contourMode {
        case "all":
            newOptions.contourMode = .all
        default:
            newOptions.contourMode = .none
        }
        
        switch classificationMode {
        case "all":
            newOptions.classificationMode = .all
        default:
            newOptions.classificationMode = .none
        }
        
        newOptions.minFaceSize = minFaceSize
        newOptions.isTrackingEnabled = trackingEnabled
        
        faceDetector = FaceDetector.faceDetector(options: newOptions)
        currentOptions = newOptions
        print("[FaceDetectorPlugin] Detector updated with new options")
    }
    
    public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
        if let args = arguments as? [String: Any], !args.isEmpty {
            updateDetectorOptions(args)
        }
        
        guard let detector = faceDetector else {
            print("[FaceDetectorPlugin] Detector not initialized")
            return []
        }
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
            print("[FaceDetectorPlugin] Could not get pixel buffer")
            return []
        }
        
        let image = VisionImage(buffer: frame.buffer)
        image.orientation = getImageOrientation(frame.orientation)
        
        let frameWidth = CVPixelBufferGetWidth(pixelBuffer)
        let frameHeight = CVPixelBufferGetHeight(pixelBuffer)
        
        var detectedFaces: [Face] = []
        let semaphore = DispatchSemaphore(value: 0)
        
        detector.process(image) { faces, error in
            if let error = error {
                print("[FaceDetectorPlugin] Detection error: \(error.localizedDescription)")
            } else if let faces = faces {
                detectedFaces = faces
            }
            semaphore.signal()
        }
        
        _ = semaphore.wait(timeout: .now() + 0.1)
        
        return detectedFaces.map { face in
            faceToDict(
                face, 
                frameWidth: frameWidth, 
                frameHeight: frameHeight,
                autoMode: autoMode,
                windowWidth: windowWidth,
                windowHeight: windowHeight,
                cameraFacing: cameraFacing
            )
        }
    }
    
    private func getImageOrientation(_ orientation: Orientation) -> UIImage.Orientation {
        switch orientation {
        case .portrait:
            return .right
        case .portraitUpsideDown:
            return .left
        case .landscapeLeft:
            return .up
        case .landscapeRight:
            return .down
        @unknown default:
            return .right
        }
    }
    
    private func faceToDict(
        _ face: Face, 
        frameWidth: Int, 
        frameHeight: Int,
        autoMode: Bool,
        windowWidth: CGFloat,
        windowHeight: CGFloat,
        cameraFacing: String
    ) -> [String: Any] {
        var result: [String: Any] = [:]
        
        // Calculate scale factors for autoMode
        let scaleX = autoMode ? windowWidth / CGFloat(frameWidth) : 1.0 / CGFloat(frameWidth)
        let scaleY = autoMode ? windowHeight / CGFloat(frameHeight) : 1.0 / CGFloat(frameHeight)
        let mirrorX = autoMode && cameraFacing == "front"
        
        // Bounding box
        let bounds = face.frame
        let x: CGFloat
        if mirrorX {
            x = windowWidth - ((bounds.origin.x + bounds.width) * scaleX)
        } else {
            x = bounds.origin.x * scaleX
        }
        
        result["bounds"] = [
            "x": x,
            "y": bounds.origin.y * scaleY,
            "width": bounds.width * scaleX,
            "height": bounds.height * scaleY
        ]
        
        // Angles
        result["rollAngle"] = face.headEulerAngleZ
        result["pitchAngle"] = face.headEulerAngleX
        result["yawAngle"] = face.headEulerAngleY
        
        // Classification probabilities
        if face.hasSmilingProbability {
            result["smilingProbability"] = face.smilingProbability
        }
        if face.hasLeftEyeOpenProbability {
            result["leftEyeOpenProbability"] = face.leftEyeOpenProbability
        }
        if face.hasRightEyeOpenProbability {
            result["rightEyeOpenProbability"] = face.rightEyeOpenProbability
        }
        
        // Tracking ID
        if face.hasTrackingID {
            result["trackingId"] = face.trackingID
        }
        
        // Landmarks
        var landmarks: [String: Any] = [:]
        
        if let leftEye = face.landmark(ofType: .leftEye) {
            landmarks["leftEye"] = pointToDict(leftEye.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let rightEye = face.landmark(ofType: .rightEye) {
            landmarks["rightEye"] = pointToDict(rightEye.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let noseBase = face.landmark(ofType: .noseBase) {
            landmarks["noseBase"] = pointToDict(noseBase.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let leftCheek = face.landmark(ofType: .leftCheek) {
            landmarks["leftCheek"] = pointToDict(leftCheek.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let rightCheek = face.landmark(ofType: .rightCheek) {
            landmarks["rightCheek"] = pointToDict(rightCheek.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let mouthLeft = face.landmark(ofType: .mouthLeft) {
            landmarks["mouthLeft"] = pointToDict(mouthLeft.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let mouthRight = face.landmark(ofType: .mouthRight) {
            landmarks["mouthRight"] = pointToDict(mouthRight.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let mouthBottom = face.landmark(ofType: .mouthBottom) {
            landmarks["mouthBottom"] = pointToDict(mouthBottom.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let leftEar = face.landmark(ofType: .leftEar) {
            landmarks["leftEar"] = pointToDict(leftEar.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        if let rightEar = face.landmark(ofType: .rightEar) {
            landmarks["rightEar"] = pointToDict(rightEar.position, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth)
        }
        
        if !landmarks.isEmpty {
            result["landmarks"] = landmarks
        }
        
        // All contours (like reference package)
        var contours: [String: Any] = [:]
        
        if let contour = face.contour(ofType: .face) {
            contours["face"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .leftEyebrowTop) {
            contours["leftEyebrowTop"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .leftEyebrowBottom) {
            contours["leftEyebrowBottom"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .rightEyebrowTop) {
            contours["rightEyebrowTop"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .rightEyebrowBottom) {
            contours["rightEyebrowBottom"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .leftEye) {
            contours["leftEye"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .rightEye) {
            contours["rightEye"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .upperLipTop) {
            contours["upperLipTop"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .upperLipBottom) {
            contours["upperLipBottom"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .lowerLipTop) {
            contours["lowerLipTop"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .lowerLipBottom) {
            contours["lowerLipBottom"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .noseBridge) {
            contours["noseBridge"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .noseBottom) {
            contours["noseBottom"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .leftCheek) {
            contours["leftCheek"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        if let contour = face.contour(ofType: .rightCheek) {
            contours["rightCheek"] = contour.points.map { pointToDict($0, scaleX: scaleX, scaleY: scaleY, mirrorX: mirrorX, windowWidth: windowWidth) }
        }
        
        if !contours.isEmpty {
            result["contours"] = contours
        }
        
        return result
    }
    
    private func pointToDict(
        _ point: VisionPoint, 
        scaleX: CGFloat, 
        scaleY: CGFloat,
        mirrorX: Bool,
        windowWidth: CGFloat
    ) -> [String: CGFloat] {
        let x: CGFloat
        if mirrorX {
            x = windowWidth - (point.x * scaleX)
        } else {
            x = point.x * scaleX
        }
        return [
            "x": x,
            "y": point.y * scaleY
        ]
    }
}
