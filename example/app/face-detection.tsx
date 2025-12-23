import { useState } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView } from 'react-native';
import {
  SmartCamera,
  Face,
  useSmartCamera,
} from '@arfuhad/react-native-smart-camera';

export default function FaceDetectionScreen() {
  const { hasPermission } = useSmartCamera();

  // Detection options
  const [performanceMode, setPerformanceMode] = useState<'fast' | 'accurate'>('fast');
  const [landmarkMode, setLandmarkMode] = useState(false);
  const [contourMode, setContourMode] = useState(false);
  const [classificationMode, setClassificationMode] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  // Detection results
  const [faces, setFaces] = useState<Face[]>([]);

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
            performanceMode,
            landmarkMode: landmarkMode ? 'all' : 'none',
            contourMode: contourMode ? 'all' : 'none',
            classificationMode: classificationMode ? 'all' : 'none',
            trackingEnabled,
          }}
          onFaceDetected={setFaces}
        />

        {/* Face count overlay */}
        <View style={styles.overlay}>
          <Text style={styles.faceCount}>
            {faces.length} face{faces.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
      </View>

      {/* Results & Options */}
      <ScrollView style={styles.panel}>
        {/* Face Info */}
        {faces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Face Info</Text>
            {faces.map((face, index) => (
              <View key={index} style={styles.faceInfo}>
                <Text style={styles.faceLabel}>Face {index + 1}</Text>
                {face.smilingProbability !== undefined && (
                  <Text style={styles.faceDetail}>
                    😊 Smiling: {(face.smilingProbability * 100).toFixed(0)}%
                  </Text>
                )}
                {face.leftEyeOpenProbability !== undefined && (
                  <Text style={styles.faceDetail}>
                    👁️ Left Eye: {(face.leftEyeOpenProbability * 100).toFixed(0)}%
                  </Text>
                )}
                {face.rightEyeOpenProbability !== undefined && (
                  <Text style={styles.faceDetail}>
                    👁️ Right Eye: {(face.rightEyeOpenProbability * 100).toFixed(0)}%
                  </Text>
                )}
                {face.trackingId !== undefined && (
                  <Text style={styles.faceDetail}>
                    🆔 Tracking ID: {face.trackingId}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>

          <OptionRow
            label="Accurate Mode"
            value={performanceMode === 'accurate'}
            onValueChange={(v) => setPerformanceMode(v ? 'accurate' : 'fast')}
          />
          <OptionRow
            label="Landmarks"
            value={landmarkMode}
            onValueChange={setLandmarkMode}
          />
          <OptionRow
            label="Contours"
            value={contourMode}
            onValueChange={setContourMode}
          />
          <OptionRow
            label="Classification"
            value={classificationMode}
            onValueChange={setClassificationMode}
          />
          <OptionRow
            label="Tracking"
            value={trackingEnabled}
            onValueChange={setTrackingEnabled}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function OptionRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
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
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  faceCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  faceInfo: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  faceLabel: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  faceDetail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
  },
});

