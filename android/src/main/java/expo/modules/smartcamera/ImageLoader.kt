package expo.modules.smartcamera

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

/**
 * Utility class for loading images from various sources
 */
class ImageLoader {
    companion object {
        private const val TAG = "ImageLoader"
    }
    
    /**
     * Load an image from various sources (suspending function for async loading)
     * 
     * @param source Image source - can be String URI, Map with "uri" key, or resource ID
     * @return Bitmap
     * @throws IllegalArgumentException if the source is invalid
     */
    suspend fun loadImage(source: Any): Bitmap = withContext(Dispatchers.IO) {
        when (source) {
            is String -> loadFromString(source)
            is Map<*, *> -> {
                val uri = source["uri"] as? String
                val base64 = source["base64"] as? String
                
                when {
                    uri != null -> loadFromString(uri)
                    base64 != null -> loadFromBase64(base64)
                    else -> throw IllegalArgumentException("Invalid image source map - must contain 'uri' or 'base64'")
                }
            }
            is Number -> throw IllegalArgumentException("Loading from resource ID not supported. Use a URI instead.")
            else -> throw IllegalArgumentException("Unsupported image source type: ${source::class.java.simpleName}")
        }
    }
    
    private fun loadFromString(source: String): Bitmap {
        return when {
            source.startsWith("data:image") -> {
                // Base64 data URI
                val base64Data = source.substringAfter("base64,")
                loadFromBase64(base64Data)
            }
            source.startsWith("http://") || source.startsWith("https://") -> {
                loadFromUrl(source)
            }
            source.startsWith("file://") -> {
                loadFromFile(source.removePrefix("file://"))
            }
            else -> {
                // Try as file path
                loadFromFile(source)
            }
        }
    }
    
    private fun loadFromBase64(base64: String): Bitmap {
        return try {
            val decodedBytes = Base64.decode(base64, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                ?: throw IllegalStateException("Failed to decode base64 image data")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to decode base64 image", e)
            throw IllegalArgumentException("Failed to decode base64 image: ${e.message}", e)
        }
    }
    
    private fun loadFromUrl(url: String): Bitmap {
        return try {
            val connection = URL(url).openConnection()
            connection.connectTimeout = 10000
            connection.readTimeout = 30000
            connection.doInput = true
            connection.connect()
            val inputStream = connection.getInputStream()
            BitmapFactory.decodeStream(inputStream)
                ?: throw IllegalStateException("Failed to decode image from URL")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load image from URL: $url", e)
            throw IllegalArgumentException("Failed to load image from URL: ${e.message}", e)
        }
    }
    
    private fun loadFromFile(path: String): Bitmap {
        return try {
            val file = File(path)
            if (!file.exists()) {
                throw IllegalArgumentException("File not found: $path")
            }
            BitmapFactory.decodeFile(path)
                ?: throw IllegalStateException("Failed to decode image from file")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load image from file: $path", e)
            throw IllegalArgumentException("Failed to load image from file: ${e.message}", e)
        }
    }
}
