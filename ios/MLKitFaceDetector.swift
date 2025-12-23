import UIKit
import Vision

// Note: This is a placeholder implementation.
// In production, you would use GoogleMLKit/FaceDetection pod.
// For now, we use Apple's Vision framework as a fallback.

class MLKitFaceDetector {
    // MARK: - Properties
    
    private var performanceMode: String = "fast"
    private var landmarkMode: String = "none"
    private var contourMode: String = "none"
    private var classificationMode: String = "none"
    private var minFaceSize: Double = 0.15
    private var trackingEnabled: Bool = false
    
    // Vision request
    private lazy var faceDetectionRequest: VNDetectFaceLandmarksRequest = {
        let request = VNDetectFaceLandmarksRequest()
        return request
    }()
    
    // MARK: - Configuration
    
    func updateOptions(_ options: FaceDetectionOptions) {
        performanceMode = options.performanceMode
        landmarkMode = options.landmarkMode
        contourMode = options.contourMode
        classificationMode = options.classificationMode
        minFaceSize = options.minFaceSize
        trackingEnabled = options.trackingEnabled
    }
    
    // MARK: - Detection
    
    func detectFaces(in image: UIImage) async throws -> [DetectedFace] {
        guard let cgImage = image.cgImage else {
            throw NSError(domain: "MLKitFaceDetector", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Could not get CGImage from UIImage"
            ])
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            
            let request = VNDetectFaceLandmarksRequest { [weak self] request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                guard let observations = request.results as? [VNFaceObservation] else {
                    continuation.resume(returning: [])
                    return
                }
                
                let faces = observations.enumerated().compactMap { index, observation in
                    self?.convertToDetectedFace(observation, index: index, imageSize: image.size)
                }
                
                continuation.resume(returning: faces)
            }
            
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    func detectFaces(in sampleBuffer: CMSampleBuffer) -> [DetectedFace] {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return []
        }
        
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        
        do {
            try handler.perform([faceDetectionRequest])
            
            guard let observations = faceDetectionRequest.results else {
                return []
            }
            
            let imageWidth = CVPixelBufferGetWidth(pixelBuffer)
            let imageHeight = CVPixelBufferGetHeight(pixelBuffer)
            let imageSize = CGSize(width: imageWidth, height: imageHeight)
            
            return observations.enumerated().compactMap { index, observation in
                convertToDetectedFace(observation, index: index, imageSize: imageSize)
            }
        } catch {
            print("[MLKitFaceDetector] Error detecting faces: \(error)")
            return []
        }
    }
    
    // MARK: - Conversion
    
    private func convertToDetectedFace(_ observation: VNFaceObservation, index: Int, imageSize: CGSize) -> DetectedFace {
        // Convert normalized coordinates to pixel coordinates
        let boundingBox = observation.boundingBox
        let x = boundingBox.origin.x * imageSize.width
        let y = (1 - boundingBox.origin.y - boundingBox.height) * imageSize.height
        let width = boundingBox.width * imageSize.width
        let height = boundingBox.height * imageSize.height
        
        var face = DetectedFace(
            bounds: FaceBounds(x: x, y: y, width: width, height: height),
            trackingId: trackingEnabled ? index : nil
        )
        
        // Add landmarks if requested
        if landmarkMode == "all", let landmarks = observation.landmarks {
            face.landmarks = extractLandmarks(landmarks, imageSize: imageSize)
        }
        
        // Add head pose
        if let yaw = observation.yaw?.doubleValue {
            face.headEulerAngleY = yaw * 180 / .pi
        }
        if let roll = observation.roll?.doubleValue {
            face.headEulerAngleZ = roll * 180 / .pi
        }
        
        return face
    }
    
    private func extractLandmarks(_ landmarks: VNFaceLandmarks2D, imageSize: CGSize) -> FaceLandmarksData {
        var data = FaceLandmarksData()
        
        if let leftEye = landmarks.leftEye {
            data.leftEye = averagePoint(leftEye.normalizedPoints, imageSize: imageSize)
        }
        if let rightEye = landmarks.rightEye {
            data.rightEye = averagePoint(rightEye.normalizedPoints, imageSize: imageSize)
        }
        if let nose = landmarks.nose {
            data.noseBase = averagePoint(nose.normalizedPoints, imageSize: imageSize)
        }
        if let outerLips = landmarks.outerLips {
            let points = outerLips.normalizedPoints
            if points.count > 0 {
                data.mouthLeft = convertPoint(points[0], imageSize: imageSize)
            }
            if points.count > points.count / 2 {
                data.mouthRight = convertPoint(points[points.count / 2], imageSize: imageSize)
            }
        }
        
        return data
    }
    
    private func averagePoint(_ points: [CGPoint], imageSize: CGSize) -> PointData {
        guard !points.isEmpty else {
            return PointData(x: 0, y: 0)
        }
        
        let sumX = points.reduce(0) { $0 + $1.x }
        let sumY = points.reduce(0) { $0 + $1.y }
        let avgX = sumX / CGFloat(points.count) * imageSize.width
        let avgY = (1 - sumY / CGFloat(points.count)) * imageSize.height
        
        return PointData(x: avgX, y: avgY)
    }
    
    private func convertPoint(_ point: CGPoint, imageSize: CGSize) -> PointData {
        return PointData(
            x: point.x * imageSize.width,
            y: (1 - point.y) * imageSize.height
        )
    }
}

// MARK: - Data Types

struct DetectedFace {
    var bounds: FaceBounds
    var landmarks: FaceLandmarksData?
    var contours: FaceContoursData?
    var smilingProbability: Double?
    var leftEyeOpenProbability: Double?
    var rightEyeOpenProbability: Double?
    var trackingId: Int?
    var headEulerAngleX: Double?
    var headEulerAngleY: Double?
    var headEulerAngleZ: Double?
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "bounds": [
                "x": bounds.x,
                "y": bounds.y,
                "width": bounds.width,
                "height": bounds.height
            ]
        ]
        
        if let landmarks = landmarks {
            dict["landmarks"] = landmarks.toDictionary()
        }
        
        if let contours = contours {
            dict["contours"] = contours.toDictionary()
        }
        
        if let smiling = smilingProbability {
            dict["smilingProbability"] = smiling
        }
        
        if let leftEye = leftEyeOpenProbability {
            dict["leftEyeOpenProbability"] = leftEye
        }
        
        if let rightEye = rightEyeOpenProbability {
            dict["rightEyeOpenProbability"] = rightEye
        }
        
        if let trackingId = trackingId {
            dict["trackingId"] = trackingId
        }
        
        if let angleY = headEulerAngleY {
            dict["headEulerAngleY"] = angleY
        }
        
        if let angleX = headEulerAngleX {
            dict["headEulerAngleX"] = angleX
        }
        
        if let angleZ = headEulerAngleZ {
            dict["headEulerAngleZ"] = angleZ
        }
        
        return dict
    }
}

struct FaceBounds {
    var x: CGFloat
    var y: CGFloat
    var width: CGFloat
    var height: CGFloat
}

struct PointData {
    var x: CGFloat
    var y: CGFloat
    
    func toDictionary() -> [String: Any] {
        return ["x": x, "y": y]
    }
}

struct FaceLandmarksData {
    var leftEye: PointData?
    var rightEye: PointData?
    var leftEar: PointData?
    var rightEar: PointData?
    var leftCheek: PointData?
    var rightCheek: PointData?
    var noseBase: PointData?
    var mouthLeft: PointData?
    var mouthRight: PointData?
    var mouthBottom: PointData?
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [:]
        
        if let leftEye = leftEye { dict["leftEye"] = leftEye.toDictionary() }
        if let rightEye = rightEye { dict["rightEye"] = rightEye.toDictionary() }
        if let leftEar = leftEar { dict["leftEar"] = leftEar.toDictionary() }
        if let rightEar = rightEar { dict["rightEar"] = rightEar.toDictionary() }
        if let leftCheek = leftCheek { dict["leftCheek"] = leftCheek.toDictionary() }
        if let rightCheek = rightCheek { dict["rightCheek"] = rightCheek.toDictionary() }
        if let noseBase = noseBase { dict["noseBase"] = noseBase.toDictionary() }
        if let mouthLeft = mouthLeft { dict["mouthLeft"] = mouthLeft.toDictionary() }
        if let mouthRight = mouthRight { dict["mouthRight"] = mouthRight.toDictionary() }
        if let mouthBottom = mouthBottom { dict["mouthBottom"] = mouthBottom.toDictionary() }
        
        return dict
    }
}

struct FaceContoursData {
    var face: [[String: Any]]?
    var leftEyebrowTop: [[String: Any]]?
    var leftEyebrowBottom: [[String: Any]]?
    var rightEyebrowTop: [[String: Any]]?
    var rightEyebrowBottom: [[String: Any]]?
    var leftEye: [[String: Any]]?
    var rightEye: [[String: Any]]?
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [:]
        
        if let face = face { dict["face"] = face }
        if let leftEyebrowTop = leftEyebrowTop { dict["leftEyebrowTop"] = leftEyebrowTop }
        if let leftEyebrowBottom = leftEyebrowBottom { dict["leftEyebrowBottom"] = leftEyebrowBottom }
        if let rightEyebrowTop = rightEyebrowTop { dict["rightEyebrowTop"] = rightEyebrowTop }
        if let rightEyebrowBottom = rightEyebrowBottom { dict["rightEyebrowBottom"] = rightEyebrowBottom }
        if let leftEye = leftEye { dict["leftEye"] = leftEye }
        if let rightEye = rightEye { dict["rightEye"] = rightEye }
        
        return dict
    }
}

