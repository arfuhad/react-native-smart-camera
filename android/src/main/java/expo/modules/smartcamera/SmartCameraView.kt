package expo.modules.smartcamera

import android.content.Context
import android.util.Size
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class SmartCameraView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    // MARK: - Properties
    
    private var previewView: PreviewView? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    
    private var currentCameraFacing: Int = CameraSelector.LENS_FACING_FRONT
    private var isActive: Boolean = true
    
    // MARK: - Initialization
    
    init {
        setupPreviewView()
    }
    
    private fun setupPreviewView() {
        previewView = PreviewView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
        addView(previewView)
    }
    
    // MARK: - Camera Setup
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                bindCameraUseCases()
            } catch (e: Exception) {
                android.util.Log.e("SmartCameraView", "Failed to get camera provider", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }
    
    private fun bindCameraUseCases() {
        val provider = cameraProvider ?: return
        val preview = previewView ?: return
        
        // Unbind all use cases before rebinding
        provider.unbindAll()
        
        if (!isActive) {
            return
        }
        
        try {
            // Build camera selector
            val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(currentCameraFacing)
                .build()
            
            // Build preview use case
            val previewUseCase = Preview.Builder()
                .setTargetResolution(Size(1280, 720))
                .build()
                .also {
                    it.setSurfaceProvider(preview.surfaceProvider)
                }
            
            // Get lifecycle owner
            val lifecycleOwner = getLifecycleOwner() ?: return
            
            // Bind use cases to camera
            provider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                previewUseCase
            )
            
        } catch (e: Exception) {
            android.util.Log.e("SmartCameraView", "Camera binding failed", e)
        }
    }
    
    private fun getLifecycleOwner(): LifecycleOwner? {
        var ctx = context
        while (ctx != null) {
            if (ctx is LifecycleOwner) {
                return ctx
            }
            ctx = if (ctx is android.content.ContextWrapper) {
                ctx.baseContext
            } else {
                null
            }
        }
        return null
    }
    
    // MARK: - Public Methods
    
    fun setCameraFacing(facing: String) {
        val newFacing = when (facing) {
            "front" -> CameraSelector.LENS_FACING_FRONT
            "back" -> CameraSelector.LENS_FACING_BACK
            else -> CameraSelector.LENS_FACING_FRONT
        }
        
        if (newFacing != currentCameraFacing) {
            currentCameraFacing = newFacing
            bindCameraUseCases()
        }
    }
    
    fun setIsActive(active: Boolean) {
        if (active != isActive) {
            isActive = active
            if (isActive) {
                bindCameraUseCases()
            } else {
                cameraProvider?.unbindAll()
            }
        }
    }
    
    // MARK: - Lifecycle
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startCamera()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cameraProvider?.unbindAll()
        cameraExecutor.shutdown()
    }
}

