import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { SmartCamera, Face, BlinkEvent, SmartCameraError } from 'react-native-smart-camera';

export default function App() {
  const [camera, setCamera] = useState<'front' | 'back'>('front');
  const [faceCount, setFaceCount] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFaceDetected = useCallback((faces: Face[]) => {
    setFaceCount(faces.length);
  }, []);

  const handleBlinkDetected = useCallback((event: BlinkEvent) => {
    if (event.isBlink) {
      setBlinkCount((prev) => prev + 1);
    }
  }, []);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setError(null);
  }, []);

  const handleError = useCallback((err: SmartCameraError) => {
    setError(err.message);
    console.error('SmartCamera error:', err);
  }, []);

  const toggleCamera = useCallback(() => {
    setCamera((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const resetBlinks = useCallback(() => {
    setBlinkCount(0);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <SmartCamera
          camera={camera}
          style={styles.camera}
          faceDetection={{
            enabled: true,
            performanceMode: 'fast',
            landmarkMode: 'all',
            classificationMode: 'all',
            trackingEnabled: true,
          }}
          blinkDetection
          onFaceDetected={handleFaceDetected}
          onBlinkDetected={handleBlinkDetected}
          onReady={handleReady}
          onError={handleError}
        />

        {/* Status Overlay */}
        <View style={styles.overlay}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, isReady ? styles.ready : styles.notReady]} />
            <Text style={styles.statusText}>
              {isReady ? 'Camera Ready' : 'Initializing...'}
            </Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{faceCount}</Text>
          <Text style={styles.statLabel}>Faces</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{blinkCount}</Text>
          <Text style={styles.statLabel}>Blinks</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>Flip Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={resetBlinks}>
          <Text style={styles.buttonText}>Reset Blinks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  ready: {
    backgroundColor: '#4ade80',
  },
  notReady: {
    backgroundColor: '#fbbf24',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    backgroundColor: '#111',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#111',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

