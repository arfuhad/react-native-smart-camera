import ExpoModulesCore
import UIKit
import AVFoundation

class SmartCameraView: ExpoView {
    // MARK: - Properties
    
    var cameraFacing: AVCaptureDevice.Position = .front {
        didSet {
            if cameraFacing != oldValue {
                setupCamera()
            }
        }
    }
    
    var isActive: Bool = true {
        didSet {
            if isActive != oldValue {
                updateCameraState()
            }
        }
    }
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var videoOutput: AVCaptureVideoDataOutput?
    
    // MARK: - Initialization
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupView()
    }
    
    // MARK: - Setup
    
    private func setupView() {
        backgroundColor = .black
        clipsToBounds = true
    }
    
    private func setupCamera() {
        // Remove existing session
        captureSession?.stopRunning()
        previewLayer?.removeFromSuperlayer()
        
        // Create new session
        let session = AVCaptureSession()
        session.sessionPreset = .high
        
        // Get camera device
        guard let device = getCameraDevice() else {
            print("[SmartCameraView] No camera device available")
            return
        }
        
        do {
            let input = try AVCaptureDeviceInput(device: device)
            
            if session.canAddInput(input) {
                session.addInput(input)
            }
            
            // Add video output
            let output = AVCaptureVideoDataOutput()
            output.videoSettings = [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
            ]
            output.alwaysDiscardsLateVideoFrames = true
            
            if session.canAddOutput(output) {
                session.addOutput(output)
            }
            
            videoOutput = output
            
            // Setup preview layer
            let preview = AVCaptureVideoPreviewLayer(session: session)
            preview.videoGravity = .resizeAspectFill
            preview.frame = bounds
            layer.addSublayer(preview)
            
            previewLayer = preview
            captureSession = session
            
            // Start session on background thread
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.captureSession?.startRunning()
            }
            
        } catch {
            print("[SmartCameraView] Error setting up camera: \(error)")
        }
    }
    
    private func getCameraDevice() -> AVCaptureDevice? {
        let deviceTypes: [AVCaptureDevice.DeviceType] = [
            .builtInWideAngleCamera,
            .builtInDualCamera,
            .builtInTrueDepthCamera
        ]
        
        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: deviceTypes,
            mediaType: .video,
            position: cameraFacing
        )
        
        return discoverySession.devices.first
    }
    
    private func updateCameraState() {
        if isActive {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.captureSession?.startRunning()
            }
        } else {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.captureSession?.stopRunning()
            }
        }
    }
    
    // MARK: - Layout
    
    override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }
    
    // MARK: - Lifecycle
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil && captureSession == nil {
            setupCamera()
        }
    }
    
    override func removeFromSuperview() {
        captureSession?.stopRunning()
        captureSession = nil
        super.removeFromSuperview()
    }
}

