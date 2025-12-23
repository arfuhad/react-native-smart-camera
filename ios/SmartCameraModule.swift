import ExpoModulesCore
import UIKit

public class SmartCameraModule: Module {
    // MARK: - Properties
    
    private lazy var faceDetector = MLKitFaceDetector()
    private lazy var webRTCBridge = WebRTCFrameBridge()
    private lazy var imageLoader = ImageLoader()
    
    private var isWebRTCInitialized = false
    
    // MARK: - Module Definition
    
    public func definition() -> ModuleDefinition {
        // Module name exposed to JavaScript
        Name("SmartCameraModule")

        // Module constants
        Constants([
            "PI": Double.pi,
            "DEFAULT_MIN_FACE_SIZE": 0.15,
            "EYE_CLOSED_THRESHOLD": 0.3,
            "EYE_OPEN_THRESHOLD": 0.7
        ])

        // Events that can be sent to JavaScript
        Events("onFacesDetected", "onBlinkDetected", "onError", "onWebRTCStateChange")

        // MARK: - Face Detection Functions
        
        // Detect faces in a static image
        AsyncFunction("detectFacesInImage") { (options: [String: Any], promise: Promise) in
            Task {
                do {
                    // Parse options
                    let faceOptions = self.parseFaceDetectionOptions(options)
                    self.faceDetector.updateOptions(faceOptions)
                    
                    // Load image
                    guard let imageSource = options["image"] else {
                        throw NSError(domain: "SmartCamera", code: 1, userInfo: [
                            NSLocalizedDescriptionKey: "Image source is required"
                        ])
                    }
                    
                    let image = try await self.imageLoader.loadImage(from: imageSource)
                    
                    // Detect faces
                    let faces = try await self.faceDetector.detectFaces(in: image)
                    
                    // Convert to dictionaries
                    let faceDicts = faces.map { $0.toDictionary() }
                    promise.resolve(faceDicts)
                } catch {
                    promise.reject("FACE_DETECTION_ERROR", error.localizedDescription)
                }
            }
        }
        
        // Update face detection options
        Function("updateFaceDetectionOptions") { (options: [String: Any]) in
            let faceOptions = self.parseFaceDetectionOptions(options)
            self.faceDetector.updateOptions(faceOptions)
        }
        
        // MARK: - WebRTC Functions
        
        // Initialize WebRTC
        AsyncFunction("initializeWebRTC") { (promise: Promise) in
            Task {
                do {
                    try await self.webRTCBridge.initialize()
                    self.isWebRTCInitialized = true
                    promise.resolve(true)
                } catch {
                    promise.reject("WEBRTC_INIT_ERROR", error.localizedDescription)
                }
            }
        }
        
        // Start WebRTC stream
        AsyncFunction("startWebRTCStream") { (constraints: [String: Any], promise: Promise) in
            Task {
                do {
                    guard self.isWebRTCInitialized else {
                        throw NSError(domain: "SmartCamera", code: 2, userInfo: [
                            NSLocalizedDescriptionKey: "WebRTC not initialized. Call initializeWebRTC first."
                        ])
                    }
                    
                    let width = constraints["width"] as? Int ?? 1280
                    let height = constraints["height"] as? Int ?? 720
                    let frameRate = constraints["frameRate"] as? Int ?? 30
                    
                    try await self.webRTCBridge.startStream(width: width, height: height, frameRate: frameRate)
                    
                    self.sendEvent("onWebRTCStateChange", ["isStreaming": true])
                    promise.resolve(true)
                } catch {
                    promise.reject("WEBRTC_START_ERROR", error.localizedDescription)
                }
            }
        }
        
        // Stop WebRTC stream
        Function("stopWebRTCStream") {
            Task {
                await self.webRTCBridge.stopStream()
                self.sendEvent("onWebRTCStateChange", ["isStreaming": false])
            }
        }
        
        // Push frame to WebRTC
        Function("pushWebRTCFrame") { (frameData: [String: Any]) in
            self.webRTCBridge.pushFrame(frameData)
        }
        
        // Get WebRTC stream status
        Function("isWebRTCStreaming") { () -> Bool in
            return self.webRTCBridge.currentStreamConfig != nil
        }
        
        // MARK: - Lifecycle Functions
        
        // Called when module is about to be deallocated
        OnDestroy {
            Task {
                await self.cleanup()
            }
        }
        
        // Called when app enters background
        OnAppEntersBackground {
            // Pause processing but keep resources ready
            print("[SmartCameraModule] App entered background")
        }
        
        // Called when app enters foreground
        OnAppEntersForeground {
            // Resume processing
            print("[SmartCameraModule] App entered foreground")
        }
    }
    
    // MARK: - Helper Methods
    
    private func parseFaceDetectionOptions(_ options: [String: Any]) -> FaceDetectionOptions {
        return FaceDetectionOptions(
            performanceMode: options["performanceMode"] as? String ?? "fast",
            landmarkMode: options["landmarkMode"] as? String ?? "none",
            contourMode: options["contourMode"] as? String ?? "none",
            classificationMode: options["classificationMode"] as? String ?? "none",
            minFaceSize: options["minFaceSize"] as? Double ?? 0.15,
            trackingEnabled: options["trackingEnabled"] as? Bool ?? false
        )
    }
    
    private func cleanup() async {
        // Stop WebRTC
        await webRTCBridge.stopStream()
        isWebRTCInitialized = false
        
        print("[SmartCameraModule] Cleanup completed")
    }
}

// MARK: - Face Detection Options

struct FaceDetectionOptions {
    var performanceMode: String
    var landmarkMode: String
    var contourMode: String
    var classificationMode: String
    var minFaceSize: Double
    var trackingEnabled: Bool
}

// MARK: - Image Loader

class ImageLoader {
    func loadImage(from source: Any) async throws -> UIImage {
        if let urlString = source as? String {
            // Load from URL string
            guard let url = URL(string: urlString) else {
                throw NSError(domain: "ImageLoader", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "Invalid URL: \(urlString)"
                ])
            }
            
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else {
                throw NSError(domain: "ImageLoader", code: 2, userInfo: [
                    NSLocalizedDescriptionKey: "Could not create image from data"
                ])
            }
            return image
        } else if let dict = source as? [String: Any], let uri = dict["uri"] as? String {
            // Load from { uri: string } object
            guard let url = URL(string: uri) else {
                throw NSError(domain: "ImageLoader", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "Invalid URI: \(uri)"
                ])
            }
            
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else {
                throw NSError(domain: "ImageLoader", code: 2, userInfo: [
                    NSLocalizedDescriptionKey: "Could not create image from data"
                ])
            }
            return image
        } else if let assetNumber = source as? Int {
            // Load from require() result (asset catalog)
            // In React Native, this would be handled by the image resolver
            throw NSError(domain: "ImageLoader", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "Loading from require() not yet implemented. Use a URI instead."
            ])
        }
        
        throw NSError(domain: "ImageLoader", code: 4, userInfo: [
            NSLocalizedDescriptionKey: "Unsupported image source type"
        ])
    }
}
