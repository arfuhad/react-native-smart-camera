import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  SmartCamera,
  BlinkEvent,
  useSmartCamera,
  useBlinkDetection,
} from 'react-native-smart-camera';

export default function BlinkDetectionScreen() {
  const { hasPermission } = useSmartCamera();
  const { blinkCount, lastBlink, resetCount } = useBlinkDetection({
    debounceMs: 300,
  });

  const [eyeState, setEyeState] = useState<{
    left: number;
    right: number;
  } | null>(null);

  const handleBlink = useCallback((event: BlinkEvent) => {
    setEyeState({
      left: event.leftEyeOpen,
      right: event.rightEyeOpen,
    });
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <SmartCamera
          camera="front"
          style={styles.camera}
          faceDetection={{
            enabled: true,
            classificationMode: 'all',
          }}
          blinkDetection
          onBlinkDetected={handleBlink}
        />

        {/* Blink counter overlay */}
        <View style={styles.overlay}>
          <Text style={styles.blinkCount}>{blinkCount}</Text>
          <Text style={styles.blinkLabel}>Blinks</Text>
        </View>
      </View>

      {/* Eye State Display */}
      <View style={styles.panel}>
        <View style={styles.eyeContainer}>
          <EyeDisplay
            label="Left Eye"
            value={eyeState?.left ?? 1}
          />
          <EyeDisplay
            label="Right Eye"
            value={eyeState?.right ?? 1}
          />
        </View>

        {/* Last Blink Info */}
        {lastBlink && (
          <View style={styles.lastBlinkContainer}>
            <Text style={styles.lastBlinkLabel}>Last Blink</Text>
            <Text style={styles.lastBlinkTime}>
              {new Date(lastBlink.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetCount}>
          <Text style={styles.resetButtonText}>Reset Counter</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works</Text>
          <Text style={styles.instructionsText}>
            The blink detector monitors your eye open probability in real-time.
            When both eyes close and then open, a blink is counted.
          </Text>
          <Text style={styles.instructionsText}>
            A 300ms debounce prevents multiple detections for a single blink.
          </Text>
        </View>
      </View>
    </View>
  );
}

function EyeDisplay({ label, value }: { label: string; value: number }) {
  const isOpen = value > 0.5;
  const percentage = Math.round(value * 100);

  return (
    <View style={styles.eyeDisplay}>
      <Text style={styles.eyeEmoji}>{isOpen ? '👁️' : '😑'}</Text>
      <Text style={styles.eyeLabel}>{label}</Text>
      <View style={styles.eyeBarContainer}>
        <View
          style={[
            styles.eyeBar,
            {
              width: `${percentage}%`,
              backgroundColor: isOpen ? '#4ade80' : '#f87171',
            },
          ]}
        />
      </View>
      <Text style={styles.eyePercentage}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  cameraContainer: {
    height: 300,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  blinkCount: {
    color: '#4a9eff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  blinkLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  panel: {
    flex: 1,
    padding: 20,
  },
  eyeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  eyeDisplay: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  eyeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  eyeLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  eyeBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  eyeBar: {
    height: '100%',
    borderRadius: 4,
  },
  eyePercentage: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  lastBlinkContainer: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  lastBlinkLabel: {
    color: '#888',
    fontSize: 14,
  },
  lastBlinkTime: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});

